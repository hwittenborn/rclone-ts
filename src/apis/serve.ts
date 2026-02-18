import { z } from "zod";
import { Transport } from "../transport";

export const ServeListSchema = z.object({
  list: z.array(
    z.object({
      id: z.string(),
      addr: z.string(),
      params: z.record(z.string(), z.any()),
    }),
  ),
});

export type ServeListResponse = z.infer<typeof ServeListSchema>;

export const ServeStartSchema = z.object({
  addr: z.string(),
  id: z.string(),
});

export type ServeStartResponse = z.infer<typeof ServeStartSchema>;

export const ServeTypesSchema = z.object({
  types: z.array(z.string()),
});

export type ServeTypesResponse = z.infer<typeof ServeTypesSchema>;

export class Serve {
  constructor(private transport: Transport) {}

  public async list(): Promise<ServeListResponse> {
    const data = await this.transport.post("serve/list");
    return ServeListSchema.parse(data);
  }

  public async start(
    type: string,
    fs: string,
    addr?: string,
    options?: Record<string, any>,
  ): Promise<ServeStartResponse> {
    const data = await this.transport.post("serve/start", { type, fs, addr, ...options });
    return ServeStartSchema.parse(data);
  }

  public async stop(id: string): Promise<void> {
    await this.transport.post("serve/stop", { id });
  }

  public async stopAll(): Promise<void> {
    await this.transport.post("serve/stopall");
  }

  public async types(): Promise<ServeTypesResponse> {
    const data = await this.transport.post("serve/types");
    return ServeTypesSchema.parse(data);
  }
}
