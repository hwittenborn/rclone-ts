import { spawn, spawnSync, ChildProcess } from "child_process";
import { createInterface } from "readline";
import * as crypto from "crypto";
import { Transport, RcloneConfig } from "./transport";
import { Core } from "./apis/core";
import { Cache } from "./apis/cache";
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

export class RcloneBinaryNotFoundError extends Error {
  constructor(execPath: string) {
    super(
      `rclone binary not found at "${execPath}". Install rclone or pass a valid execPath in Rclone options.`,
    );
    this.name = "RcloneBinaryNotFoundError";
  }
}

export class Rclone {
  private transport: Transport;
  private process: ChildProcess | null = null;
  private execPath: string;
  private args: string[];

  public core: Core;
  public cache: Cache;
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
    this.cache = new Cache(this.transport);
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

    this.ensureRcloneInstalled();

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
          if ((err as NodeJS.ErrnoException).code === "ENOENT") {
            reject(new RcloneBinaryNotFoundError(this.execPath));
            return;
          }

          if ((err as NodeJS.ErrnoException).code === "EACCES") {
            reject(
              new Error(`Cannot execute rclone binary at "${this.execPath}" (permission denied).`),
            );
            return;
          }

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

  private ensureRcloneInstalled(): void {
    const check = spawnSync(this.execPath, ["version"], {
      stdio: "ignore",
      timeout: 5000,
    });

    if (check.error) {
      const code = (check.error as NodeJS.ErrnoException).code;
      if (code === "ENOENT") {
        throw new RcloneBinaryNotFoundError(this.execPath);
      }

      if (code === "EACCES") {
        throw new Error(`Cannot execute rclone binary at "${this.execPath}" (permission denied).`);
      }

      throw new Error(
        `Failed to execute rclone binary at "${this.execPath}": ${check.error.message}`,
      );
    }
  }

  public stop(): void {
    if (this.process) {
      this.process.kill();
      this.process = null;
    }
  }
}
