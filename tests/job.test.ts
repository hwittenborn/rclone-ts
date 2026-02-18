import { RcloneTestHelper } from "./helpers";
import { Rclone } from "@/client";

describe("Job API", () => {
  let client: Rclone;

  beforeAll(async () => {
    await RcloneTestHelper.startServer();
    client = RcloneTestHelper.getClient();
  });

  afterAll(async () => {
    await RcloneTestHelper.stopServer();
  });

  it("should list jobs", async () => {
    const list = await client.job.list();
    expect(list.jobids).toBeDefined();
  });
});
