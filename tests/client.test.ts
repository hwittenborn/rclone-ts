import { Rclone, RcloneBinaryNotFoundError } from "@/client";

describe("Rclone binary checks", () => {
  it("should throw a helpful error when rclone is not installed", async () => {
    const client = new Rclone({
      execPath: "definitely-not-a-real-rclone-binary",
    });

    try {
      await client.init();
      throw new Error("Expected init() to fail");
    } catch (error) {
      expect(error).toBeInstanceOf(RcloneBinaryNotFoundError);
      expect((error as Error).message).toContain("Install rclone");
      expect((error as Error).message).toContain("execPath");
    }
  });
});
