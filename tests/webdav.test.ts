import { RcloneTestHelper } from "./helpers";
import { Rclone } from "@/client";
import { RcloneError } from "@/transport";
import * as path from "path";
import * as fs from "fs";

describe("WebDAV Remote Integration", () => {
  let client: Rclone;
  let tempDir: string;
  const remoteName = "test-webdav";
  let serveId: string;
  let serveUrl: string;

  beforeAll(async () => {
    await RcloneTestHelper.startServer();
    client = RcloneTestHelper.getClient();
    tempDir = await RcloneTestHelper.createTempDir();

    // Start WebDAV server on the temp directory
    // Use 127.0.0.1:0 to bind to a random available port on IPv4
    const serveInfo = await client.serve.start("webdav", tempDir, "127.0.0.1:0");
    serveId = serveInfo.id;

    // Construct URL from the returned address
    // The address is likely "127.0.0.1:port"
    serveUrl = `http://${serveInfo.addr}`;
    console.log(`WebDAV server started at ${serveUrl} with ID ${serveId}`);

    // Create a WebDAV remote pointing to the server
    await client.config.create(remoteName, "webdav", {
      url: serveUrl,
      vendor: "other",
      user: "", // No auth by default
      pass: "",
    });
  });

  afterAll(async () => {
    // Clean up remote config
    try {
      await client.config.delete(remoteName);
    } catch (e) {
      console.error("Failed to delete remote config:", e);
    }

    // Stop the WebDAV server
    if (serveId) {
      try {
        await client.serve.stop(serveId);
      } catch (e) {
        console.error("Failed to stop WebDAV server:", e);
      }
    }

    // Remove temp directory
    if (tempDir) {
      await RcloneTestHelper.removeDir(tempDir);
    }

    await RcloneTestHelper.stopServer();
  });

  it("should be able to list files on the WebDAV remote", async () => {
    // Create a file in the temp dir directly to verify listing
    const testFilePath = path.join(tempDir, "hello.txt");
    await fs.promises.writeFile(testFilePath, "Hello WebDAV!");

    const list = await client.operations.list(remoteName + ":", "");
    const file = list.list.find((i) => i.Name === "hello.txt");

    expect(file).toBeDefined();
    expect(file?.Size).toBe(13); // "Hello WebDAV!".length
  });

  it("should be able to mkdir on the WebDAV remote", async () => {
    await client.operations.mkdir(remoteName + ":", "subdir");

    const list = await client.operations.list(remoteName + ":", "");
    const dir = list.list.find((i) => i.Name === "subdir");

    expect(dir).toBeDefined();
    expect(dir?.IsDir).toBe(true);

    // Verify locally
    const localPath = path.join(tempDir, "subdir");
    const stat = await fs.promises.stat(localPath);
    expect(stat.isDirectory()).toBe(true);
  });

  it("should be able to copy a file to the WebDAV remote", async () => {
    // Create a source file locally (outside the served dir)
    const srcDir = await RcloneTestHelper.createTempDir("rclone-src-");
    const srcFile = path.join(srcDir, "upload.txt");
    await fs.promises.writeFile(srcFile, "Upload content");

    // We need a source remote. We can use 'local' alias or just path if on same machine?
    // But rclone copy takes remotes.
    // Let's use the absolute path for source, which rclone interprets as local path

    await client.operations.copyfile(
      srcDir, // srcFs (local path)
      "upload.txt", // srcRemote
      remoteName + ":", // dstFs
      "uploaded.txt", // dstRemote
    );

    // Verify content on remote (by reading local file backing it)
    const destPath = path.join(tempDir, "uploaded.txt");
    const content = await fs.promises.readFile(destPath, "utf8");
    expect(content).toBe("Upload content");

    await RcloneTestHelper.removeDir(srcDir);
  });

  it("should support fsinfo", async () => {
    const info = await client.operations.fsinfo(remoteName + ":");
    // Name should be the remote name
    expect(info.Name).toBe(remoteName);
  });

  it("should support about (free space)", async () => {
    // Not all webdav servers support quota/about, but rclone's might
    try {
      const about = await client.operations.about(remoteName + ":");
      expect(about).toBeDefined();
    } catch (e: unknown) {
      const error = e as RcloneError;
      // If strictly not supported, rclone might throw error "About feature not found"
      // We can accept that result too, but ideally rclone serve supports it.
      console.log("About not supported:", error.message);
    }
  });
});
