import { z } from "zod";
import { Transport } from "../transport";

export const CacheStatsSchema = z.record(z.string(), z.unknown());

export type CacheStatsResponse = z.infer<typeof CacheStatsSchema>;

export class Cache {
  constructor(private transport: Transport) {}

  public async expire(remote: string, withData?: boolean): Promise<void> {
    await this.transport.post("cache/expire", { remote, withData });
  }

  public async fetch(chunks: string, files: string[]): Promise<void> {
    const params: Record<string, string> = { chunks };
    files.forEach((file, index) => {
      params[index === 0 ? "file" : `file${index + 1}`] = file;
    });
    await this.transport.post("cache/fetch", params);
  }

  public async stats(): Promise<CacheStatsResponse> {
    const data = await this.transport.post("cache/stats");
    return CacheStatsSchema.parse(data);
  }
}
