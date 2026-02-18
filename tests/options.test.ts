import { RcloneTestHelper } from "./helpers";
import { Rclone } from "@/client";

describe("Options API", () => {
  let client: Rclone;

  beforeAll(async () => {
    await RcloneTestHelper.startServer();
    client = RcloneTestHelper.getClient();
  });

  afterAll(async () => {
    await RcloneTestHelper.stopServer();
  });

  it("should get options blocks", async () => {
    const blocks = await client.options.blocks();
    expect(blocks.options).toContain("main");
  });

  it("should get options", async () => {
    const opts = await client.options.get();
    expect(opts).toBeDefined();
    expect(opts["main"]).toBeDefined();
  });
});
