import { RcloneTestHelper } from "./helpers";
import { Rclone } from "@/client";

describe("Core API", () => {
  let client: Rclone;

  beforeAll(async () => {
    await RcloneTestHelper.startServer();
    client = RcloneTestHelper.getClient();
  });

  afterAll(async () => {
    await RcloneTestHelper.stopServer();
  });

  it("should return version information", async () => {
    const version = await client.core.version();
    expect(version).toBeDefined();
    expect(version.version).toMatch(/^v/);
    expect(version.os).toBeDefined();
  });

  it("should return stats", async () => {
    const stats = await client.core.stats();
    expect(stats).toBeDefined();
    expect(stats.bytes).toBeGreaterThanOrEqual(0);
  });

  it("should return memstats", async () => {
    const memstats = await client.core.memstats();
    expect(memstats).toBeDefined();
    expect(typeof memstats.Alloc).toBe("number");
  });

  it("should return bwlimit", async () => {
    const limit = await client.core.bwlimit();
    expect(limit).toBeDefined();
    expect(limit.bytesPerSecond).toBeDefined();
  });
});
