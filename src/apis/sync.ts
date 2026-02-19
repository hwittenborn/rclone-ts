import { Transport } from "../transport";
import { JsonObject } from "../types";
import { z } from "zod";

export interface SyncOptions {
  _async?: boolean;
  _group?: string;
  _config?: JsonObject;
  _filter?: JsonObject;
  [key: string]: string | number | boolean | JsonObject | undefined;
}

export const SyncAsyncResponseSchema = z.object({
  jobid: z.number(),
  executeId: z.string(),
});

export type SyncAsyncResponse = z.infer<typeof SyncAsyncResponseSchema>;
export type SyncResponse = SyncAsyncResponse | Record<string, never>;

export class Sync {
  constructor(private transport: Transport) {}

  private parseSyncResponse(data: unknown): SyncResponse {
    const asyncResult = SyncAsyncResponseSchema.safeParse(data);
    if (asyncResult.success) {
      return asyncResult.data;
    }

    return z.object({}).passthrough().parse(data) as Record<string, never>;
  }

  public async bisync(path1: string, path2: string, options?: SyncOptions): Promise<SyncResponse> {
    const data = await this.transport.post("sync/bisync", { path1, path2, ...options });
    return this.parseSyncResponse(data);
  }

  public async copy(srcFs: string, dstFs: string, options?: SyncOptions): Promise<SyncResponse> {
    const data = await this.transport.post("sync/copy", { srcFs, dstFs, ...options });
    return this.parseSyncResponse(data);
  }

  public async move(srcFs: string, dstFs: string, options?: SyncOptions): Promise<SyncResponse> {
    const data = await this.transport.post("sync/move", { srcFs, dstFs, ...options });
    return this.parseSyncResponse(data);
  }

  public async sync(srcFs: string, dstFs: string, options?: SyncOptions): Promise<SyncResponse> {
    const data = await this.transport.post("sync/sync", { srcFs, dstFs, ...options });
    return this.parseSyncResponse(data);
  }
}
