import { RcloneTestHelper } from "./helpers";
import { Rclone } from "@/client";

describe("Operations API", () => {
  let client: Rclone;
  let tempDir: string;
  const remoteName = "test-ops-local";

  beforeAll(async () => {
    await RcloneTestHelper.startServer();
    client = RcloneTestHelper.getClient();
    tempDir = await RcloneTestHelper.createTempDir();
    await client.config.create(remoteName, "alias", { remote: tempDir });
  });

  afterAll(async () => {
    await client.config.delete(remoteName);
    await RcloneTestHelper.removeDir(tempDir);
    await RcloneTestHelper.stopServer();
  });

  it("should mkdir", async () => {
    await client.operations.mkdir(remoteName + ":", "testdir");

    // Verify via rclone list
    const list = await client.operations.list(remoteName + ":", "");
    const dir = list.list.find((i) => i.Name === "testdir");
    expect(dir).toBeDefined();
    expect(dir?.IsDir).toBe(true);
  });

  it("should list", async () => {
    const list = await client.operations.list(remoteName + ":", "");
    expect(list.list).toBeDefined();
  });

  it("should size", async () => {
    const size = await client.operations.size(remoteName + ":");
    expect(size.count).toBeGreaterThanOrEqual(0);
  });

  it("should about", async () => {
    const about = await client.operations.about(remoteName + ":");
    expect(about).toBeDefined();
    if (about.total !== undefined) {
      expect(about.total).toBeGreaterThan(0);
    }
  });

  it("should fsinfo", async () => {
    const info = await client.operations.fsinfo(remoteName + ":");
    // fsinfo on an alias usually returns info about the underlying remote (local)
    // Check if Name is local or alias. Usually "local" if it unwraps.
    expect(info.Name).toBe("local");
  });

  it("should uploadfile", async () => {
    const boundary = "----rcloneTsOpsBoundary";
    const multipartBody =
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="file"; filename="uploaded.txt"\r\n` +
      `Content-Type: text/plain\r\n\r\n` +
      `hello from uploadfile\r\n` +
      `--${boundary}--\r\n`;

    await client.operations.uploadfile(remoteName + ":", "", Buffer.from(multipartBody, "utf8"), {
      group: "test-upload-group",
      contentType: `multipart/form-data; boundary=${boundary}`,
    });

    const stat = await client.operations.stat(remoteName + ":", "uploaded.txt");
    expect(stat.item).not.toBeNull();
    expect(stat.item?.Name).toBe("uploaded.txt");
  });
});
