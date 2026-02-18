import { z } from "zod";
import { Transport } from "../transport";

export const CoreVersionSchema = z.object({
  version: z.string(),
  decomposed: z.array(z.number()),
  isGit: z.boolean(),
  isBeta: z.boolean(),
  os: z.string(),
  osKernel: z.string(),
  osVersion: z.string(),
  osArch: z.string(),
  arch: z.string(),
  goVersion: z.string(),
  linking: z.string(),
  goTags: z.string(),
});

export type CoreVersionResponse = z.infer<typeof CoreVersionSchema>;

export const CoreStatsSchema = z.object({
  bytes: z.number(),
  checks: z.number(),
  deletedDirs: z.number().optional(),
  deletes: z.number(),
  elapsedTime: z.number(),
  errors: z.number(),
  eta: z.number().nullable(),
  fatalError: z.boolean(),
  lastError: z.string().optional(),
  renames: z.number(),
  listed: z.number(),
  retryError: z.boolean(),
  serverSideCopies: z.number(),
  serverSideCopyBytes: z.number(),
  serverSideMoves: z.number(),
  serverSideMoveBytes: z.number(),
  speed: z.number(),
  totalBytes: z.number(),
  totalChecks: z.number(),
  totalTransfers: z.number(),
  transferTime: z.number(),
  transfers: z.number(),
  transferring: z
    .array(
      z.object({
        bytes: z.number(),
        eta: z.number().nullable(),
        name: z.string(),
        percentage: z.number(),
        speed: z.number(),
        speedAvg: z.number(),
        size: z.number(),
      }),
    )
    .optional(),
  checking: z.array(z.string()).optional(),
});

export type CoreStatsResponse = z.infer<typeof CoreStatsSchema>;

export const CoreBwLimitSchema = z.object({
  bytesPerSecond: z.number(),
  bytesPerSecondRx: z.number(),
  bytesPerSecondTx: z.number(),
  rate: z.string(),
});

export type CoreBwLimitResponse = z.infer<typeof CoreBwLimitSchema>;

export const CoreCommandSchema = z.object({
  result: z.string().optional(),
  error: z.boolean().optional(),
});

export type CoreCommandResponse = z.infer<typeof CoreCommandSchema>;

export const CoreDuSchema = z.object({
  dir: z.string(),
  info: z.object({
    Available: z.number(),
    Free: z.number(),
    Total: z.number(),
  }),
});

export type CoreDuResponse = z.infer<typeof CoreDuSchema>;

export const CoreGroupListSchema = z.object({
  groups: z.array(z.string()).nullable(),
});

export type CoreGroupListResponse = z.infer<typeof CoreGroupListSchema>;

export const CoreMemStatsSchema = z.record(z.string(), z.number());

export type CoreMemStatsResponse = z.infer<typeof CoreMemStatsSchema>;

export const CoreObscureSchema = z.object({
  obscured: z.string(),
});

export type CoreObscureResponse = z.infer<typeof CoreObscureSchema>;

export const CorePidSchema = z.object({
  pid: z.number(),
});

export type CorePidResponse = z.infer<typeof CorePidSchema>;

export const CoreTransferredSchema = z.object({
  transferred: z.array(
    z.object({
      name: z.string(),
      size: z.number(),
      bytes: z.number(),
      checked: z.boolean(),
      what: z.string(),
      timestamp: z.number(),
      error: z.string(),
      jobid: z.number(),
    }),
  ),
});

export type CoreTransferredResponse = z.infer<typeof CoreTransferredSchema>;

export class Core {
  constructor(private transport: Transport) {}

  public async version(): Promise<CoreVersionResponse> {
    const data = await this.transport.post("core/version");
    return CoreVersionSchema.parse(data);
  }

  public async stats(options?: { group?: string; short?: boolean }): Promise<CoreStatsResponse> {
    const data = await this.transport.post("core/stats", options);
    return CoreStatsSchema.parse(data);
  }

  public async bwlimit(rate?: string): Promise<CoreBwLimitResponse> {
    const data = await this.transport.post("core/bwlimit", rate ? { rate } : {});
    return CoreBwLimitSchema.parse(data);
  }

  public async command(
    command: string,
    arg?: string[],
    opt?: Record<string, string>,
    returnType?: string,
  ): Promise<CoreCommandResponse> {
    const data = await this.transport.post("core/command", { command, arg, opt, returnType });
    return CoreCommandSchema.parse(data);
  }

  public async du(dir?: string): Promise<CoreDuResponse> {
    const data = await this.transport.post("core/du", dir ? { dir } : {});
    return CoreDuSchema.parse(data);
  }

  public async gc(): Promise<void> {
    return this.transport.post("core/gc");
  }

  public async groupList(): Promise<CoreGroupListResponse> {
    const data = await this.transport.post("core/group-list");
    return CoreGroupListSchema.parse(data);
  }

  public async memstats(): Promise<CoreMemStatsResponse> {
    const data = await this.transport.post("core/memstats");
    return CoreMemStatsSchema.parse(data);
  }

  public async obscure(clear: string): Promise<CoreObscureResponse> {
    const data = await this.transport.post("core/obscure", { clear });
    return CoreObscureSchema.parse(data);
  }

  public async pid(): Promise<CorePidResponse> {
    const data = await this.transport.post("core/pid");
    return CorePidSchema.parse(data);
  }

  public async quit(exitCode?: number): Promise<void> {
    return this.transport.post("core/quit", { exitCode });
  }

  public async statsDelete(group: string): Promise<void> {
    return this.transport.post("core/stats-delete", { group });
  }

  public async statsReset(group?: string): Promise<void> {
    return this.transport.post("core/stats-reset", group ? { group } : {});
  }

  public async transferred(group?: string): Promise<CoreTransferredResponse> {
    const data = await this.transport.post("core/transferred", group ? { group } : {});
    return CoreTransferredSchema.parse(data);
  }
}
