import { Transport } from "../transport";

export interface SyncOptions {
  _async?: boolean;
  _group?: string;
  _config?: Record<string, any>;
  _filter?: Record<string, any>;
  [key: string]: any;
}

export class Sync {
  constructor(private transport: Transport) {}

  public async bisync(path1: string, path2: string, options?: SyncOptions): Promise<any> {
    return this.transport.post("sync/bisync", { path1, path2, ...options });
  }

  public async copy(srcFs: string, dstFs: string, options?: SyncOptions): Promise<any> {
    return this.transport.post("sync/copy", { srcFs, dstFs, ...options });
  }

  public async move(srcFs: string, dstFs: string, options?: SyncOptions): Promise<any> {
    return this.transport.post("sync/move", { srcFs, dstFs, ...options });
  }

  public async sync(srcFs: string, dstFs: string, options?: SyncOptions): Promise<any> {
    return this.transport.post("sync/sync", { srcFs, dstFs, ...options });
  }
}
