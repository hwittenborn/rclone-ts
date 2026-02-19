import { z } from "zod";
import { Transport } from "../transport";
import { JsonObjectSchema, JsonValueSchema, JsonObject } from "../types";

export const ConfigPathsSchema = z.object({
  cache: z.string(),
  config: z.string(),
  temp: z.string(),
});

export type ConfigPathsResponse = z.infer<typeof ConfigPathsSchema>;

export const ConfigListRemotesSchema = z.object({
  remotes: z.array(z.string()),
});

export type ConfigListRemotesResponse = z.infer<typeof ConfigListRemotesSchema>;

export const ConfigGetSchema = JsonObjectSchema;

export type ConfigGetResponse = z.infer<typeof ConfigGetSchema>;

export const ConfigDumpSchema = z.record(z.string(), JsonObjectSchema);

export type ConfigDumpResponse = z.infer<typeof ConfigDumpSchema>;

const ConfigOptionSchema = z
  .object({
    Name: z.string(),
    Type: z.string(),
    Help: z.string(),
    Default: JsonValueSchema.optional(),
    Advanced: z.boolean().optional(),
    Required: z.boolean().optional(),
    IsPassword: z.boolean().optional(),
    Sensitive: z.boolean().optional(),
    Exclusive: z.boolean().optional(),
  })
  .passthrough();

const ConfigProviderSchema = z
  .object({
    Name: z.string(),
    Description: z.string(),
    Prefix: z.string(),
    Options: z.array(ConfigOptionSchema).optional(),
    CommandHelp: z.array(JsonObjectSchema).optional(),
    Aliases: z.array(z.string()).nullable().optional(),
    Hide: z.boolean().optional(),
  })
  .passthrough();

export const ConfigProvidersSchema = z.object({
  providers: z.array(ConfigProviderSchema),
});

export type ConfigProvidersResponse = z.infer<typeof ConfigProvidersSchema>;

export class Config {
  constructor(private transport: Transport) {}

  public async create(
    name: string,
    type: string,
    parameters: JsonObject,
    opt?: {
      obscure?: boolean;
      noObscure?: boolean;
      noOutput?: boolean;
      nonInteractive?: boolean;
    },
  ): Promise<void> {
    await this.transport.post("config/create", { name, type, parameters, opt });
  }

  public async delete(name: string): Promise<void> {
    await this.transport.post("config/delete", { name });
  }

  public async dump(): Promise<ConfigDumpResponse> {
    const data = await this.transport.post("config/dump");
    return ConfigDumpSchema.parse(data);
  }

  public async get(name: string): Promise<ConfigGetResponse> {
    const data = await this.transport.post("config/get", { name });
    return ConfigGetSchema.parse(data);
  }

  public async listRemotes(): Promise<ConfigListRemotesResponse> {
    const data = await this.transport.post("config/listremotes");
    return ConfigListRemotesSchema.parse(data);
  }

  public async password(name: string, parameters: JsonObject): Promise<void> {
    await this.transport.post("config/password", { name, parameters });
  }

  public async paths(): Promise<ConfigPathsResponse> {
    const data = await this.transport.post("config/paths");
    return ConfigPathsSchema.parse(data);
  }

  public async providers(): Promise<ConfigProvidersResponse> {
    const data = await this.transport.post("config/providers");
    return ConfigProvidersSchema.parse(data);
  }

  public async setPath(path: string): Promise<void> {
    await this.transport.post("config/setpath", { path });
  }

  public async unlock(configPassword: string): Promise<void> {
    await this.transport.post("config/unlock", { configPassword });
  }

  public async update(
    name: string,
    parameters: JsonObject,
    opt?: {
      obscure?: boolean;
      noObscure?: boolean;
      noOutput?: boolean;
      nonInteractive?: boolean;
    },
  ): Promise<void> {
    await this.transport.post("config/update", { name, parameters, opt });
  }
}
