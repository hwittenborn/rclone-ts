import { z } from "zod";
import { Transport } from "../transport";

export const VfsListSchema = z.object({
  vfses: z.array(z.string()),
});

export type VfsListResponse = z.infer<typeof VfsListSchema>;

export const VfsPollIntervalSchema = z.record(z.string(), z.any());

export type VfsPollIntervalResponse = z.infer<typeof VfsPollIntervalSchema>;

export const VfsQueueSchema = z.object({
  queue: z
    .array(
      z.object({
        name: z.string(),
        id: z.number(),
        size: z.number(),
        expiry: z.number(),
        tries: z.number(),
        delay: z.number(),
        uploading: z.boolean(),
      }),
    )
    .optional(),
});

export type VfsQueueResponse = z.infer<typeof VfsQueueSchema>;

export const VfsStatsSchema = z.object({
  diskCache: z
    .object({
      bytesUsed: z.number(),
      erroredFiles: z.number(),
      files: z.number(),
      hashType: z.number(),
      outOfSpace: z.boolean(),
      path: z.string(),
      pathMeta: z.string(),
      uploadsInProgress: z.number(),
      uploadsQueued: z.number(),
    })
    .optional(),
  fs: z.string(),
  inUse: z.number(),
  metadataCache: z.object({
    dirs: z.number(),
    files: z.number(),
  }),
  opt: z.record(z.string(), z.any()),
});

export type VfsStatsResponse = z.infer<typeof VfsStatsSchema>;

export class Vfs {
  constructor(private transport: Transport) {}

  public async forget(fs?: string, files?: string[], dirs?: string[]): Promise<void> {
    const params: Record<string, string> = { fs: fs || "" };
    if (files) {
      files.forEach((f, i) => (params[`file${i === 0 ? "" : i + 1}`] = f));
    }
    if (dirs) {
      dirs.forEach((d, i) => (params[`dir${i === 0 ? "" : i + 1}`] = d));
    }
    await this.transport.post("vfs/forget", params);
  }

  public async list(): Promise<VfsListResponse> {
    const data = await this.transport.post("vfs/list");
    return VfsListSchema.parse(data);
  }

  public async pollInterval(
    fs?: string,
    interval?: string,
    timeout?: string,
  ): Promise<VfsPollIntervalResponse> {
    const params: Record<string, any> = { fs };
    if (interval) params.interval = interval;
    if (timeout) params.timeout = timeout;
    const data = await this.transport.post("vfs/poll-interval", params);
    return VfsPollIntervalSchema.parse(data);
  }

  public async queue(fs?: string): Promise<VfsQueueResponse> {
    const data = await this.transport.post("vfs/queue", { fs });
    return VfsQueueSchema.parse(data);
  }

  public async queueSetExpiry(
    id: number,
    expiry: number,
    fs?: string,
    relative?: boolean,
  ): Promise<void> {
    await this.transport.post("vfs/queue-set-expiry", { id, expiry, fs, relative });
  }

  public async refresh(fs?: string, dirs?: string[], recursive?: boolean): Promise<void> {
    const params: Record<string, any> = { fs, recursive };
    if (dirs) {
      dirs.forEach((d, i) => (params[`dir${i === 0 ? "" : i + 1}`] = d));
    }
    await this.transport.post("vfs/refresh", params);
  }

  public async stats(fs?: string): Promise<VfsStatsResponse> {
    const data = await this.transport.post("vfs/stats", { fs });
    return VfsStatsSchema.parse(data);
  }
}
