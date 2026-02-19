import * as http from "http";
import { AddressInfo } from "net";
import { z } from "zod";
import { Transport, RcloneError } from "@/transport";
import { Rc } from "@/apis/rc";

type Handler = (
  req: http.IncomingMessage,
  body: Record<string, unknown>,
) => {
  status?: number;
  headers?: Record<string, string>;
  body?: unknown;
};

const readJsonBody = async (req: http.IncomingMessage): Promise<Record<string, unknown>> => {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  if (chunks.length === 0) {
    return {};
  }

  return JSON.parse(Buffer.concat(chunks).toString("utf8")) as Record<string, unknown>;
};

const startMockServer = async (
  routes: Record<string, Handler>,
): Promise<{ server: http.Server; url: string }> => {
  const server = http.createServer(async (req, res) => {
    if (!req.url || req.method !== "POST") {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "not found" }));
      return;
    }

    const path = req.url.startsWith("/") ? req.url.slice(1) : req.url;
    const handler = routes[path];

    if (!handler) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "not found", path }));
      return;
    }

    const body = await readJsonBody(req);
    const response = handler(req, body);
    const status = response.status ?? 200;
    const headers = response.headers ?? { "Content-Type": "application/json" };

    res.writeHead(status, headers);
    if (response.body === undefined) {
      res.end();
      return;
    }

    if (typeof response.body === "string") {
      res.end(response.body);
      return;
    }

    res.end(JSON.stringify(response.body));
  });

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", () => resolve()));
  const address = server.address() as AddressInfo;
  return { server, url: `http://127.0.0.1:${address.port}` };
};

describe("Transport", () => {
  it("posts JSON and returns JSON responses", async () => {
    const { server, url } = await startMockServer({
      "rc/noop": (_req, body) => ({ body }),
    });
    const transport = new Transport({ url });

    try {
      const result = await transport.post<Record<string, unknown>, Record<string, unknown>>(
        "rc/noop",
        { potato: 1, sausage: "2" },
      );
      expect(result).toEqual({ potato: 1, sausage: "2" });
    } finally {
      server.close();
    }
  });

  it("sends authorization headers when credentials are configured", async () => {
    const { server, url } = await startMockServer({
      "rc/noopauth": (req) => ({
        body: { auth: req.headers.authorization ?? null },
      }),
    });

    const transport = new Transport({
      url,
      username: "user",
      password: "pass",
    });

    try {
      const result = await transport.post<{ auth: string }>("rc/noopauth");
      expect(result.auth).toBe(`Basic ${Buffer.from("user:pass").toString("base64")}`);
    } finally {
      server.close();
    }
  });

  it("throws a strongly typed RcloneError for documented rc errors", async () => {
    const { server, url } = await startMockServer({
      "operations/rmdir": (_req, body) => ({
        status: 400,
        body: {
          error: 'Expecting string value for key "remote" (was float64)',
          input: body,
          status: 400,
          path: "operations/rmdir",
        },
      }),
    });

    const transport = new Transport({ url });

    try {
      await expect(transport.post("operations/rmdir", { fs: "/tmp", remote: 3 })).rejects.toEqual(
        expect.objectContaining({
          name: "RcloneError",
          status: 400,
          path: "operations/rmdir",
          input: { fs: "/tmp", remote: 3 },
        }),
      );
    } finally {
      server.close();
    }
  });

  it("normalizes partial rc error payloads to typed errors", async () => {
    const { server, url } = await startMockServer({
      "rc/error": () => ({
        status: 500,
        body: { error: "arbitrary error" },
      }),
    });

    const transport = new Transport({ url });

    try {
      await transport.post("rc/error", { potato: "1" });
      throw new Error("expected error");
    } catch (error) {
      expect(error).toBeInstanceOf(RcloneError);
      const rcError = error as RcloneError<Record<string, unknown>>;
      expect(rcError.message).toBe("arbitrary error");
      expect(rcError.status).toBe(500);
      expect(rcError.path).toBe("rc/error");
      expect(rcError.input).toEqual({ potato: "1" });
    } finally {
      server.close();
    }
  });

  it("supports generic typed access to any rc path via rc.call", async () => {
    const { server, url } = await startMockServer({
      "custom/endpoint": () => ({
        body: { value: "ok", count: 3 },
      }),
    });

    const rc = new Rc(new Transport({ url }));

    try {
      const result = await rc.call(
        "custom/endpoint",
        {},
        z.object({
          value: z.string(),
          count: z.number(),
        }),
      );

      expect(result).toEqual({ value: "ok", count: 3 });
    } finally {
      server.close();
    }
  });

  it("normalizes non-JSON auth failures to typed errors", async () => {
    const { server, url } = await startMockServer({
      "rc/noopauth": () => ({
        status: 401,
        headers: { "Content-Type": "text/plain" },
        body: "401 Unauthorized",
      }),
    });

    const transport = new Transport({ url });

    try {
      await transport.post("rc/noopauth", { foo: "bar" });
      throw new Error("expected error");
    } catch (error) {
      expect(error).toBeInstanceOf(RcloneError);
      const rcError = error as RcloneError<Record<string, unknown>>;
      expect(rcError.message).toBe("401 Unauthorized");
      expect(rcError.status).toBe(401);
      expect(rcError.path).toBe("rc/noopauth");
      expect(rcError.input).toEqual({ foo: "bar" });
    } finally {
      server.close();
    }
  });
});
