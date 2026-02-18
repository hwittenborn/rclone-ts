import { z } from "zod";
import { Transport } from "../transport";

export const RcListSchema = z.object({
  commands: z.array(
    z.object({
      AuthRequired: z.boolean(),
      Help: z.string(),
      NeedsRequest: z.boolean(),
      NeedsResponse: z.boolean(),
      Path: z.string(),
      Title: z.string(),
    }),
  ),
});

export type RcListResponse = z.infer<typeof RcListSchema>;

export class Rc {
  constructor(private transport: Transport) {}

  public async error(): Promise<void> {
    await this.transport.post("rc/error");
  }

  public async fatal(): Promise<void> {
    await this.transport.post("rc/fatal");
  }

  public async list(): Promise<RcListResponse> {
    const data = await this.transport.post("rc/list");
    return RcListSchema.parse(data);
  }

  public async noop(params: Record<string, any> = {}): Promise<Record<string, any>> {
    return this.transport.post("rc/noop", params);
  }

  public async noopauth(params: Record<string, any> = {}): Promise<Record<string, any>> {
    return this.transport.post("rc/noopauth", params);
  }

  public async panic(): Promise<void> {
    await this.transport.post("rc/panic");
  }
}
