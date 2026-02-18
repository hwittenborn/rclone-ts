import { z } from "zod";
import { Transport } from "../transport";

export const FscacheEntriesSchema = z.object({
  entries: z.number(),
});

export type FscacheEntriesResponse = z.infer<typeof FscacheEntriesSchema>;

export class FsCache {
  constructor(private transport: Transport) {}

  public async clear(): Promise<void> {
    await this.transport.post("fscache/clear");
  }

  public async entries(): Promise<FscacheEntriesResponse> {
    const data = await this.transport.post("fscache/entries");
    return FscacheEntriesSchema.parse(data);
  }
}
