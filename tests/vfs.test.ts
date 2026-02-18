import { RcloneTestHelper } from "./helpers";
import { Rclone } from "@/client";

describe("VFS API", () => {
  let client: Rclone;

  beforeAll(async () => {
    await RcloneTestHelper.startServer();
    client = RcloneTestHelper.getClient();
  });

  afterAll(async () => {
    await RcloneTestHelper.stopServer();
  });

  it("should list vfs", async () => {
    const list = await client.vfs.list();
    expect(list.vfses).toBeDefined();
  });
});
