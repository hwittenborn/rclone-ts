import { z } from "zod";
import { Transport } from "../transport";

export const OptionsBlocksSchema = z.object({
  options: z.array(z.string()),
});

export type OptionsBlocksResponse = z.infer<typeof OptionsBlocksSchema>;

export const OptionsGetSchema = z.record(z.string(), z.record(z.string(), z.any()));

export type OptionsGetResponse = z.infer<typeof OptionsGetSchema>;

export const OptionsInfoSchema = z.record(z.string(), z.array(z.record(z.string(), z.any())));

export type OptionsInfoResponse = z.infer<typeof OptionsInfoSchema>;

export const OptionsLocalSchema = z.object({
  config: z.record(z.string(), z.any()),
  filter: z.record(z.string(), z.any()),
});

export type OptionsLocalResponse = z.infer<typeof OptionsLocalSchema>;

export class Options {
  constructor(private transport: Transport) {}

  public async blocks(): Promise<OptionsBlocksResponse> {
    const data = await this.transport.post("options/blocks");
    return OptionsBlocksSchema.parse(data);
  }

  public async get(blocks?: string): Promise<OptionsGetResponse> {
    const data = await this.transport.post("options/get", blocks ? { blocks } : {});
    return OptionsGetSchema.parse(data);
  }

  public async info(blocks?: string): Promise<OptionsInfoResponse> {
    const data = await this.transport.post("options/info", blocks ? { blocks } : {});
    return OptionsInfoSchema.parse(data);
  }

  public async local(): Promise<OptionsLocalResponse> {
    const data = await this.transport.post("options/local");
    return OptionsLocalSchema.parse(data);
  }

  public async set(options: Record<string, Record<string, any>>): Promise<void> {
    await this.transport.post("options/set", options);
  }
}
