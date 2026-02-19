import { z } from "zod";
import { Transport } from "../transport";
import { JsonObject } from "../types";

export const MountListMountsSchema = z.object({
  mountPoints: z.array(z.string()),
});

export type MountListMountsResponse = z.infer<typeof MountListMountsSchema>;

export const MountTypesSchema = z.object({
  mountTypes: z.array(z.string()),
});

export type MountTypesResponse = z.infer<typeof MountTypesSchema>;

export class Mount {
  constructor(private transport: Transport) {}

  public async listMounts(): Promise<MountListMountsResponse> {
    const data = await this.transport.post("mount/listmounts");
    return MountListMountsSchema.parse(data);
  }

  public async mount(
    fs: string,
    mountPoint: string,
    mountType?: string,
    mountOpt?: JsonObject,
    vfsOpt?: JsonObject,
  ): Promise<void> {
    await this.transport.post("mount/mount", { fs, mountPoint, mountType, mountOpt, vfsOpt });
  }

  public async types(): Promise<MountTypesResponse> {
    const data = await this.transport.post("mount/types");
    return MountTypesSchema.parse(data);
  }

  public async unmount(mountPoint: string): Promise<void> {
    await this.transport.post("mount/unmount", { mountPoint });
  }

  public async unmountAll(): Promise<void> {
    await this.transport.post("mount/unmountall");
  }
}
