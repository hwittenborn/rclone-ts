import { Transport } from "../transport";

export class Debug {
  constructor(private transport: Transport) {}

  public async setBlockProfileRate(rate: number): Promise<void> {
    await this.transport.post("debug/set-block-profile-rate", { rate });
  }

  public async setGcPercent(gcPercent: number): Promise<number> {
    return this.transport.post("debug/set-gc-percent", { "gc-percent": gcPercent });
  }

  public async setMutexProfileFraction(rate: number): Promise<number> {
    const result = await this.transport.post<any>("debug/set-mutex-profile-fraction", { rate });
    return result.previousRate;
  }

  public async setSoftMemoryLimit(memLimit: number): Promise<number> {
    return this.transport.post("debug/set-soft-memory-limit", { "mem-limit": memLimit });
  }
}
