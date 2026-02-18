import { spawn, ChildProcess } from "child_process";
import { createInterface } from "readline";
import * as crypto from "crypto";
import { Transport, RcloneConfig } from "./transport";
import { Core } from "./apis/core";
import { Config } from "./apis/config";
import { Operations } from "./apis/operations";
import { Options } from "./apis/options";
import { Job } from "./apis/job";
import { Sync } from "./apis/sync";
import { Mount } from "./apis/mount";
import { Backend } from "./apis/backend";
import { Debug } from "./apis/debug";
import { FsCache } from "./apis/fscache";
import { PluginsCtl } from "./apis/pluginsctl";
import { Rc } from "./apis/rc";
import { Serve } from "./apis/serve";
import { Vfs } from "./apis/vfs";

export interface RcloneOptions extends Partial<RcloneConfig> {
  execPath?: string;
  args?: string[];
}

export class Rclone {
  private transport: Transport;
  private process: ChildProcess | null = null;
  private execPath: string;
  private args: string[];

  public core: Core;
  public config: Config;
  public operations: Operations;
  public options: Options;
  public job: Job;
  public sync: Sync;
  public mount: Mount;
  public backend: Backend;
  public debug: Debug;
  public fscache: FsCache;
  public pluginsctl: PluginsCtl;
  public rc: Rc;
  public serve: Serve;
  public vfs: Vfs;

  constructor(options: RcloneOptions = {}) {
    this.execPath = options.execPath || "rclone";
    this.args = options.args || [];

    const initialConfig: RcloneConfig = {
      url: options.url || "",
      username: options.username,
      password: options.password,
    };

    this.transport = new Transport(initialConfig);

    this.core = new Core(this.transport);
    this.config = new Config(this.transport);
    this.operations = new Operations(this.transport);
    this.options = new Options(this.transport);
    this.job = new Job(this.transport);
    this.sync = new Sync(this.transport);
    this.mount = new Mount(this.transport);
    this.backend = new Backend(this.transport);
    this.debug = new Debug(this.transport);
    this.fscache = new FsCache(this.transport);
    this.pluginsctl = new PluginsCtl(this.transport);
    this.rc = new Rc(this.transport);
    this.serve = new Serve(this.transport);
    this.vfs = new Vfs(this.transport);
  }

  public async init(): Promise<void> {
    if (this.transport.configuration.url) {
      return;
    }

    const user = `user_${crypto.randomBytes(4).toString("hex")}`;
    const pass = crypto.randomBytes(16).toString("hex");

    return new Promise((resolve, reject) => {
      const args = [
        "rcd",
        "--rc-addr=localhost:0",
        `--rc-user=${user}`,
        `--rc-pass=${pass}`,
        ...this.args,
      ];

      this.process = spawn(this.execPath, args);

      if (!this.process.stderr || !this.process.stdout) {
        return reject(new Error("Failed to spawn rclone process: cannot access stdout/stderr"));
      }

      let resolved = false;

      const stderrInterface = createInterface({ input: this.process.stderr });
      const stdoutInterface = createInterface({ input: this.process.stdout });

      const checkLine = (line: string) => {
        const match = line.match(/Serving remote control on (https?:\/\/[^\s]+)/);
        if (match && !resolved) {
          let url = match[1];
          if (url.endsWith("/")) {
            url = url.slice(0, -1);
          }

          this.transport.setConfig({
            url,
            username: user,
            password: pass,
          });

          resolved = true;
          resolve();
        }
      };

      stderrInterface.on("line", checkLine);
      stdoutInterface.on("line", checkLine);

      this.process.on("error", (err) => {
        if (!resolved) {
          reject(err);
        }
      });

      this.process.on("close", (code) => {
        if (!resolved) {
          reject(new Error(`Rclone process exited early with code ${code}`));
        }
        this.process = null;
      });
    });
  }

  public stop(): void {
    if (this.process) {
      this.process.kill();
      this.process = null;
    }
  }
}
