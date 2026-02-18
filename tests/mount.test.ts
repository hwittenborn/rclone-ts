import { RcloneTestHelper } from "./helpers";
import { Rclone } from "@/client";

describe("Mount API", () => {
  let client: Rclone;

  beforeAll(async () => {
    await RcloneTestHelper.startServer();
    client = RcloneTestHelper.getClient();
  });

  afterAll(async () => {
    await RcloneTestHelper.stopServer();
  });

  it("should list mounts", async () => {
    const mounts = await client.mount.listMounts();
    expect(mounts.mountPoints).toBeDefined();
  });
});
