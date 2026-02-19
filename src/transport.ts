import fetch from "cross-fetch";
import { z } from "zod";
import { JsonObject } from "./types";

export interface RcloneConfig {
  url: string;
  username?: string;
  password?: string;
}

export interface RcloneErrorResponse<TInput = unknown> {
  error: string;
  input: TInput;
  status: number;
  path: string;
}

export class RcloneError<TInput = unknown> extends Error {
  public status: number;
  public path: string;
  public input: TInput;

  constructor(response: RcloneErrorResponse<TInput>) {
    super(response.error);
    this.name = "RcloneError";
    this.status = response.status;
    this.path = response.path;
    this.input = response.input;
  }
}

const RcloneErrorSchema = z
  .object({
    error: z.string(),
    input: z.unknown().optional(),
    status: z.number().optional(),
    path: z.string().optional(),
  })
  .passthrough();

const TransportErrorMessageSchema = z.object({
  message: z.string(),
});

const RcloneErrorResponseSchema = z.object({
  error: z.string(),
  input: z.unknown(),
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

  public async post<T, TParams = JsonObject>(command: string, params?: TParams): Promise<T> {
    const requestBody = (params ?? {}) as TParams;
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
      body: JSON.stringify(requestBody),
    });

    const contentType = response.headers.get("content-type");
    let data: unknown;

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
      const errorMessage =
        parsedError.success && parsedError.data.error
          ? parsedError.data.error
          : TransportErrorMessageSchema.safeParse(data).success
            ? TransportErrorMessageSchema.parse(data).message
            : `Rclone RC error: ${response.status} ${response.statusText}`;

      const normalizedError = RcloneErrorResponseSchema.parse({
        error: errorMessage,
        input: parsedError.success ? (parsedError.data.input ?? requestBody) : requestBody,
        status: parsedError.success
          ? (parsedError.data.status ?? response.status)
          : response.status,
        path: parsedError.success ? (parsedError.data.path ?? command) : command,
      });

      throw new RcloneError(normalizedError);
    }

    return data as T;
  }
}
