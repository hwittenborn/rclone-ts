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
});
