import { z } from "zod";
import { Transport } from "../transport";

export const BackendCommandSchema = z.object({
  result: z.any().optional(),
});

export type BackendCommandResponse = z.infer<typeof BackendCommandSchema>;

export class Backend {
  constructor(private transport: Transport) {}

  public async command(
    command: string,
    fs: string,
    arg?: string[],
    opt?: Record<string, string>,
  ): Promise<BackendCommandResponse> {
    const data = await this.transport.post("backend/command", { command, fs, arg, opt });
    return BackendCommandSchema.parse(data);
  }
}
