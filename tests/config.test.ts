import { RcloneTestHelper } from "./helpers";
import { Rclone } from "@/client";

describe("Config API", () => {
  let client: Rclone;
  let tempDir: string;
  const remoteName = "test-local-remote";

  beforeAll(async () => {
    await RcloneTestHelper.startServer();
    client = RcloneTestHelper.getClient();
    tempDir = await RcloneTestHelper.createTempDir();
  });

  afterAll(async () => {
    await RcloneTestHelper.removeDir(tempDir);
    await RcloneTestHelper.stopServer();
  });

  it("should create a new remote", async () => {
    await client.config.create(remoteName, "alias", { remote: tempDir });
    const remotes = await client.config.listRemotes();
    expect(remotes.remotes).toContain(remoteName);
  });

  it("should get remote configuration", async () => {
    const config = await client.config.get(remoteName);
    expect(config.type).toBe("alias");
    expect(config.remote).toBe(tempDir);
  });

  it("should delete the remote", async () => {
    await client.config.delete(remoteName);
    const remotes = await client.config.listRemotes();
    expect(remotes.remotes).not.toContain(remoteName);
  });
});
