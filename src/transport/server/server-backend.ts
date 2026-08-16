import http from "http";
import https from "https";
import { Backend } from "../../interface";
import { TlsClientError } from "../../utils";

// ponytail: fixed 60s request timeout, no retry/backoff — external server
// assumed healthy behind the user's LB. Expose server.timeout / add retry only
// when a real deployment needs it.
const TIMEOUT_MS = 60_000;

export class ServerBackend implements Backend {
  private base: string;
  private headers: Record<string, string>;
  private transport: typeof http | typeof https;
  private agent: http.Agent;

  constructor({
    url,
    apiKey,
    concurrency,
  }: {
    url: string;
    apiKey?: string;
    concurrency?: number;
  }) {
    this.base = url.replace(/\/$/, "");
    this.headers = {
      "Content-Type": "application/json",
      ...(apiKey && { "X-API-KEY": apiKey }),
    };
    this.transport = url.startsWith("https") ? https : http;
    this.agent = new this.transport.Agent({
      keepAlive: true,
      maxSockets: concurrency ?? 256,
    });
  }

  private httpJson(
    method: string,
    path: string,
    body?: string,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const req = this.transport.request(
        `${this.base}${path}`,
        { method, headers: this.headers, agent: this.agent },
        (res) => {
          const chunks: Buffer[] = [];
          res.on("data", (c) => chunks.push(c));
          res.on("end", () => {
            const text = Buffer.concat(chunks).toString("utf8");
            const status = res.statusCode ?? 0;
            if (status < 200 || status >= 300) {
              reject(new TlsClientError(`server ${status}: ${text}`));
            } else {
              resolve(text);
            }
          });
        },
      );

      // http.request has NO default timeout — a hung socket would wait forever.
      req.setTimeout(TIMEOUT_MS, () => {
        req.destroy();
        reject(
          new TlsClientError(`server request timed out after ${TIMEOUT_MS}ms`),
        );
      });
      // Unhandled 'error' would crash the process.
      req.on("error", (e) => reject(new TlsClientError(e)));

      if (body !== undefined) req.write(body);
      req.end();
    });
  }

  async request(payload: string): Promise<string> {
    if (!payload) return "";
    return this.httpJson("POST", "/api/forward", payload);
  }

  async destroySession(payload: string): Promise<string> {
    if (!payload) return "";
    return this.httpJson("POST", "/api/free-session", payload);
  }

  async freeMemory(): Promise<void> {
    // Server frees inline in Handle — no-op.
  }

  async destroyAll(): Promise<string> {
    return this.httpJson("GET", "/api/free-all");
  }

  async destroy(): Promise<void> {
    this.agent.destroy();
  }
}
