import { RcloneTestHelper } from "./helpers";
import { Rclone } from "@/client";
import { RcloneError } from "@/transport";

describe("RC API", () => {
  let client: Rclone;

  beforeAll(async () => {
    await RcloneTestHelper.startServer();
    client = RcloneTestHelper.getClient();
  });

  afterAll(async () => {
    await RcloneTestHelper.stopServer();
  });

  it("should list commands", async () => {
    const list = await client.rc.list();
    expect(list.commands).toBeDefined();
    expect(list.commands.length).toBeGreaterThan(0);
    const noopCmd = list.commands.find((c) => c.Path === "rc/noop");
    expect(noopCmd).toBeDefined();
  });

  it("should echo parameters with noop", async () => {
    const params = { foo: "bar", baz: 123 };
    const result = await client.rc.noop(params);
    expect(result).toEqual(expect.objectContaining(params));
  });

  it("should return error object on rc/error", async () => {
    await expect(client.rc.error()).rejects.toThrow(RcloneError);

    try {
      await client.rc.error();
    } catch (e: any) {
      expect(e).toBeInstanceOf(RcloneError);
      // Verify structure of the error if possible, though Transport wraps it
      expect(e.status).toBe(500);
      expect(e.path).toBe("rc/error");
    }
  });
});
