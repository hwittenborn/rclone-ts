import { Transport } from "../transport";
import { z } from "zod";

const DebugSetGcPercentSchema = z.object({
  "existing-gc-percent": z.number(),
});

const DebugSetSoftMemoryLimitSchema = z.object({
  "existing-mem-limit": z.number(),
});

const DebugSetMutexProfileFractionSchema = z.object({
  previousRate: z.number(),
});

export class Debug {
  constructor(private transport: Transport) {}

  public async setBlockProfileRate(rate: number): Promise<void> {
    await this.transport.post("debug/set-block-profile-rate", { rate });
  }

  public async setGcPercent(gcPercent: number): Promise<number> {
    const data = await this.transport.post("debug/set-gc-percent", { "gc-percent": gcPercent });
    return DebugSetGcPercentSchema.parse(data)["existing-gc-percent"];
  }

  public async setMutexProfileFraction(rate: number): Promise<number> {
    const data = await this.transport.post("debug/set-mutex-profile-fraction", { rate });
    return DebugSetMutexProfileFractionSchema.parse(data).previousRate;
  }

  public async setSoftMemoryLimit(memLimit: number): Promise<number> {
    const data = await this.transport.post("debug/set-soft-memory-limit", {
      "mem-limit": memLimit,
    });
    return DebugSetSoftMemoryLimitSchema.parse(data)["existing-mem-limit"];
  }
}
