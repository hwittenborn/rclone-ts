import { z } from "zod";
import { Transport } from "../transport";
import { JsonObjectSchema } from "../types";

export const OperationsAboutSchema = z.object({
  free: z.number().optional(),
  total: z.number().optional(),
  used: z.number().optional(),
  trashed: z.number().optional(),
  other: z.number().optional(),
});

export type OperationsAboutResponse = z.infer<typeof OperationsAboutSchema>;

export const OperationsCheckSchema = z.object({
  success: z.boolean(),
  status: z.string(),
  hashType: z.string().optional(),
  combined: z.array(z.string()),
  missingOnSrc: z.array(z.string()),
  missingOnDst: z.array(z.string()),
  match: z.array(z.string()),
  differ: z.array(z.string()),
  error: z.array(z.string()),
});

export type OperationsCheckResponse = z.infer<typeof OperationsCheckSchema>;

export const OperationsFsInfoSchema = z.object({
  Features: z.record(z.string(), z.boolean()),
  Hashes: z.array(z.string()),
  MetadataInfo: JsonObjectSchema.nullable().optional(),
  Name: z.string(),
  Precision: z.number(),
  Root: z.string().optional(),
  String: z.string(),
});

export type OperationsFsInfoResponse = z.infer<typeof OperationsFsInfoSchema>;

export const OperationsHashSumSchema = z.object({
  hashsum: z.array(z.string()),
  hashType: z.string(),
});

export type OperationsHashSumResponse = z.infer<typeof OperationsHashSumSchema>;

export const OperationsHashSumFileSchema = z.object({
  hash: z.string(),
  hashType: z.string(),
});

export type OperationsHashSumFileResponse = z.infer<typeof OperationsHashSumFileSchema>;

export const OperationsListSchema = z.object({
  list: z.array(
    z.object({
      IsDir: z.boolean(),
      MimeType: z.string().optional(),
      ModTime: z.string().optional(),
      Name: z.string(),
      Path: z.string(),
      Size: z.number(),
      ID: z.string().optional(),
      Encrypted: z.string().optional(),
      EncryptedPath: z.string().optional(),
      Hashes: z.record(z.string(), z.string()).optional(),
      Metadata: z.record(z.string(), z.string()).optional(),
    }),
  ),
});

export type OperationsListResponse = z.infer<typeof OperationsListSchema>;

export const OperationsPublicLinkSchema = z.object({
  url: z.string(),
});

export type OperationsPublicLinkResponse = z.infer<typeof OperationsPublicLinkSchema>;

export const OperationsSizeSchema = z.object({
  bytes: z.number(),
  count: z.number(),
  sizeless: z.number().optional(),
});

export type OperationsSizeResponse = z.infer<typeof OperationsSizeSchema>;

export const OperationsStatSchema = z.object({
  item: z
    .object({
      IsDir: z.boolean(),
      MimeType: z.string().optional(),
      ModTime: z.string().optional(),
      Name: z.string(),
      Path: z.string(),
      Size: z.number(),
      ID: z.string().optional(),
      Encrypted: z.string().optional(),
      EncryptedPath: z.string().optional(),
      Hashes: z.record(z.string(), z.string()).optional(),
      Metadata: z.record(z.string(), z.string()).optional(),
    })
    .nullable(),
});

export type OperationsStatResponse = z.infer<typeof OperationsStatSchema>;

export class Operations {
  constructor(private transport: Transport) {}

  public async about(fs: string): Promise<OperationsAboutResponse> {
    const data = await this.transport.post("operations/about", { fs });
    return OperationsAboutSchema.parse(data);
  }

  public async check(
    srcFs: string,
    dstFs: string,
    options?: {
      download?: boolean;
      checkFileHash?: string;
      checkFileFs?: string;
      checkFileRemote?: string;
      oneWay?: boolean;
      combined?: boolean;
      missingOnSrc?: boolean;
      missingOnDst?: boolean;
      match?: boolean;
      differ?: boolean;
      error?: boolean;
    },
  ): Promise<OperationsCheckResponse> {
    const data = await this.transport.post("operations/check", { srcFs, dstFs, ...options });
    return OperationsCheckSchema.parse(data);
  }

  public async cleanup(fs: string): Promise<void> {
    await this.transport.post("operations/cleanup", { fs });
  }

  public async copyfile(
    srcFs: string,
    srcRemote: string,
    dstFs: string,
    dstRemote: string,
  ): Promise<void> {
    await this.transport.post("operations/copyfile", { srcFs, srcRemote, dstFs, dstRemote });
  }

  public async copyurl(
    fs: string,
    remote: string,
    url: string,
    autoFilename?: boolean,
  ): Promise<void> {
    await this.transport.post("operations/copyurl", { fs, remote, url, autoFilename });
  }

  public async delete(fs: string): Promise<void> {
    await this.transport.post("operations/delete", { fs });
  }

  public async deletefile(fs: string, remote: string): Promise<void> {
    await this.transport.post("operations/deletefile", { fs, remote });
  }

  public async fsinfo(fs: string): Promise<OperationsFsInfoResponse> {
    const data = await this.transport.post("operations/fsinfo", { fs });
    return OperationsFsInfoSchema.parse(data);
  }

  public async hashsum(
    fs: string,
    hashType: string,
    options?: {
      download?: boolean;
      base64?: boolean;
    },
  ): Promise<OperationsHashSumResponse> {
    const data = await this.transport.post("operations/hashsum", { fs, hashType, ...options });
    return OperationsHashSumSchema.parse(data);
  }

  public async hashsumfile(
    fs: string,
    remote: string,
    hashType: string,
    options?: {
      download?: boolean;
      base64?: boolean;
    },
  ): Promise<OperationsHashSumFileResponse> {
    const data = await this.transport.post("operations/hashsumfile", {
      fs,
      remote,
      hashType,
      ...options,
    });
    return OperationsHashSumFileSchema.parse(data);
  }

  public async list(
    fs: string,
    remote: string,
    opt?: {
      recurse?: boolean;
      noModTime?: boolean;
      showEncrypted?: boolean;
      showOrigIDs?: boolean;
      showHash?: boolean;
      noMimeType?: boolean;
      dirsOnly?: boolean;
      filesOnly?: boolean;
      metadata?: boolean;
      hashTypes?: string[];
      limit?: number;
    },
  ): Promise<OperationsListResponse> {
    const data = await this.transport.post("operations/list", { fs, remote, opt });
    return OperationsListSchema.parse(data);
  }

  public async mkdir(fs: string, remote: string): Promise<void> {
    await this.transport.post("operations/mkdir", { fs, remote });
  }

  public async movefile(
    srcFs: string,
    srcRemote: string,
    dstFs: string,
    dstRemote: string,
  ): Promise<void> {
    await this.transport.post("operations/movefile", { srcFs, srcRemote, dstFs, dstRemote });
  }

  public async publiclink(
    fs: string,
    remote: string,
    options?: {
      unlink?: boolean;
      expire?: string;
    },
  ): Promise<OperationsPublicLinkResponse> {
    const data = await this.transport.post("operations/publiclink", { fs, remote, ...options });
    return OperationsPublicLinkSchema.parse(data);
  }

  public async purge(fs: string, remote: string): Promise<void> {
    await this.transport.post("operations/purge", { fs, remote });
  }

  public async rmdir(fs: string, remote: string): Promise<void> {
    await this.transport.post("operations/rmdir", { fs, remote });
  }

  public async rmdirs(fs: string, remote: string, leaveRoot?: boolean): Promise<void> {
    await this.transport.post("operations/rmdirs", { fs, remote, leaveRoot });
  }

  public async settier(fs: string, tier: string): Promise<void> {
    await this.transport.post("operations/settier", { fs, tier });
  }

  public async settierfile(fs: string, remote: string, tier: string): Promise<void> {
    await this.transport.post("operations/settierfile", { fs, remote, tier });
  }

  public async size(fs: string): Promise<OperationsSizeResponse> {
    const data = await this.transport.post("operations/size", { fs });
    return OperationsSizeSchema.parse(data);
  }

  public async stat(
    fs: string,
    remote: string,
    opt?: {
      recurse?: boolean;
      noModTime?: boolean;
      showEncrypted?: boolean;
      showOrigIDs?: boolean;
      showHash?: boolean;
      noMimeType?: boolean;
      dirsOnly?: boolean;
      filesOnly?: boolean;
      metadata?: boolean;
      hashTypes?: string[];
    },
  ): Promise<OperationsStatResponse> {
    const data = await this.transport.post("operations/stat", { fs, remote, opt });
    return OperationsStatSchema.parse(data);
  }

  public async uploadfile(_fs: string, _remote: string, _fileData: unknown): Promise<void> {
    throw new Error("operations/uploadfile not implemented: requires multipart/form-data support");
  }
}
