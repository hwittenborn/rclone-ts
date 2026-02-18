import { z } from "zod";
import { Transport } from "../transport";

export const PluginsCtlListSchema = z.object({
  loadedPlugins: z.array(z.string()).optional(),
  testPlugins: z.array(z.string()).optional(),
});

export type PluginsCtlListResponse = z.infer<typeof PluginsCtlListSchema>;

export class PluginsCtl {
  constructor(private transport: Transport) {}

  public async addPlugin(url: string): Promise<void> {
    await this.transport.post("pluginsctl/addPlugin", { url });
  }

  public async getPluginsForType(
    type: string,
    pluginType?: string,
  ): Promise<PluginsCtlListResponse> {
    const data = await this.transport.post("pluginsctl/getPluginsForType", { type, pluginType });
    return PluginsCtlListSchema.parse(data);
  }

  public async listPlugins(): Promise<PluginsCtlListResponse> {
    const data = await this.transport.post("pluginsctl/listPlugins");
    return PluginsCtlListSchema.parse(data);
  }

  public async listTestPlugins(): Promise<PluginsCtlListResponse> {
    const data = await this.transport.post("pluginsctl/listTestPlugins");
    return PluginsCtlListSchema.parse(data);
  }

  public async removePlugin(name: string): Promise<void> {
    await this.transport.post("pluginsctl/removePlugin", { name });
  }

  public async removeTestPlugin(name: string): Promise<void> {
    await this.transport.post("pluginsctl/removeTestPlugin", { name });
  }
}
