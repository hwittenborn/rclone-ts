import { z } from "zod";
import { Transport } from "../transport";
import { JsonObject } from "../types";

export type RcParams = JsonObject;

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

  public async call<TResponse, TParams extends RcParams>(
    path: string,
    params: TParams,
    schema: z.ZodType<TResponse>,
  ): Promise<TResponse>;
  public async call<TResponse = JsonObject, TParams extends RcParams = RcParams>(
    path: string,
    params?: TParams,
    schema?: z.ZodType<TResponse>,
  ): Promise<TResponse> {
    const data = await this.transport.post<unknown, TParams>(path, params);
    if (schema) {
      return schema.parse(data);
    }
    return data as TResponse;
  }

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

  public async noop(params: JsonObject = {}): Promise<JsonObject> {
    return this.transport.post("rc/noop", params);
  }

  public async noopauth(params: JsonObject = {}): Promise<JsonObject> {
    return this.transport.post("rc/noopauth", params);
  }

  public async panic(): Promise<void> {
    await this.transport.post("rc/panic");
  }
}
