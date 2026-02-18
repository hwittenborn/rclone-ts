import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { Rclone } from "@/client";

export class RcloneTestHelper {
  private static client: Rclone | null = null;
  private static configPath: string | null = null;

  static async startServer(): Promise<void> {
    if (!this.client) {
      // Create a temp config file
      const tmpDir = os.tmpdir();
      const configName = `rclone-test-${Math.random().toString(36).substring(7)}.conf`;
      this.configPath = path.join(tmpDir, configName);
      // Ensure file exists (empty)
      await fs.promises.writeFile(this.configPath, "");

      this.client = new Rclone({
        args: ["--config", this.configPath],
      });
      await this.client.init();
    }
  }

  static async stopServer(): Promise<void> {
    if (this.client) {
      this.client.stop();
      this.client = null;
    }
    if (this.configPath) {
      try {
        await fs.promises.unlink(this.configPath);
      } catch {}
      this.configPath = null;
    }
  }

  static getClient(): Rclone {
    if (!this.client) {
      throw new Error("Server not started");
    }
    return this.client;
  }

  static async createTempDir(prefix: string = "rclone-ts-test-"): Promise<string> {
    const tmpDir = os.tmpdir();
    return await fs.promises.mkdtemp(path.join(tmpDir, prefix));
  }

  static async removeDir(dir: string): Promise<void> {
    await fs.promises.rm(dir, { recursive: true, force: true });
  }
}
