import { RcloneTestHelper } from "./helpers";
import { Rclone } from "@/client";
import * as path from "path";
import * as fs from "fs";

describe("Sync API", () => {
  let client: Rclone;
  let srcDir: string;
  let dstDir: string;
  const srcRemote = "test-sync-src";
  const dstRemote = "test-sync-dst";

  beforeAll(async () => {
    await RcloneTestHelper.startServer();
    client = RcloneTestHelper.getClient();
    srcDir = await RcloneTestHelper.createTempDir("src-");
    dstDir = await RcloneTestHelper.createTempDir("dst-");

    // Use alias to point to specific local path
    await client.config.create(srcRemote, "alias", { remote: srcDir });
    await client.config.create(dstRemote, "alias", { remote: dstDir });

    await fs.promises.writeFile(path.join(srcDir, "file.txt"), "content");
  });

  afterAll(async () => {
    try {
      await client.config.delete(srcRemote);
    } catch {}
    try {
      await client.config.delete(dstRemote);
    } catch {}
    await RcloneTestHelper.removeDir(srcDir);
    await RcloneTestHelper.removeDir(dstDir);
    await RcloneTestHelper.stopServer();
  });

  it("should copy", async () => {
    // Verify rclone sees the file
    const list = await client.operations.list(srcRemote + ":", "");
    expect(list.list.some((i) => i.Name === "file.txt")).toBe(true);

    // Perform copy
    await client.sync.copy(srcRemote + ":", dstRemote + ":");

    // Check result
    const destFile = path.join(dstDir, "file.txt");
    const exists = fs.existsSync(destFile);
    expect(exists).toBe(true);
  });
});
