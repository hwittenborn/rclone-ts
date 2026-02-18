import fetch from "cross-fetch";
import { z } from "zod";

export interface RcloneConfig {
  url: string;
  username?: string;
  password?: string;
}

export interface RcloneErrorResponse {
  error: string;
  input: unknown;
  status: number;
  path: string;
}

export class RcloneError extends Error {
  public status: number;
  public path: string;
  public input: unknown;

  constructor(response: RcloneErrorResponse) {
    super(response.error);
    this.name = "RcloneError";
    this.status = response.status;
    this.path = response.path;
    this.input = response.input;
  }
}

const RcloneErrorSchema = z.object({
  error: z.string(),
  input: z.unknown().optional().default({}),
  status: z.number(),
  path: z.string(),
});

export class Transport {
  private config: RcloneConfig;

  constructor(config: RcloneConfig) {
    this.config = config;
  }

  public setConfig(config: RcloneConfig) {
    this.config = config;
  }

  public get configuration(): RcloneConfig {
    return this.config;
  }

  public async post<T>(command: string, params: any = {}): Promise<T> {
    const url = `${this.config.url}/${command}`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (this.config.username && this.config.password) {
      const auth = Buffer.from(`${this.config.username}:${this.config.password}`).toString(
        "base64",
      );
      headers["Authorization"] = `Basic ${auth}`;
    }

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(params),
    });

    const contentType = response.headers.get("content-type");
    let data: any;

    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = { message: text };
      }
    }

    if (!response.ok) {
      const parsedError = RcloneErrorSchema.safeParse(data);
      if (parsedError.success) {
        throw new RcloneError(parsedError.data);
      }
      throw new Error(`Rclone RC error: ${response.status} ${response.statusText}`);
    }

    return data as T;
  }
}
