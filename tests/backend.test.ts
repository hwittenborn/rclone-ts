import { RcloneTestHelper } from "./helpers";
import { Rclone } from "@/client";

describe("Backend API", () => {
  let client: Rclone;
  let tempDir: string;
  const remoteName = "test-backend-remote";

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

  it("should run backend command", async () => {
    const res = await client.backend.command("noop", remoteName + ":");
    expect(res.result).toBeNull(); // noop returns result: null usually
  });
});
