/**
 * Managed transport: downloads + spawns one local `tls-client-api` process
 * and talks to it over the same HTTP surface as `ServerBackend`. The child
 * lives for the process lifetime of this `Client` — killed on `destroyTLS()`,
 * on host exit, and on SIGINT/SIGTERM. SIGKILL to us orphans it (uncatchable)
 * — its per-spawn temp dir is swept by the startup reaper on the next spawn.
 */
import { spawn, ChildProcess } from "child_process";
import fs from "fs/promises";
import fsSync from "fs";
import net from "net";
import crypto from "crypto";
import path from "path";
import os from "os";
import http from "http";
import { Backend } from "../../interface";
import { PlatformMap } from "../../interface/native";
import { TlsClientError } from "../../utils/tlsError";
import { logger } from "../../utils/logger";
import { LibraryDownloader } from "../../utils/download";
import { packageVersion } from "../../utils/version";
import { ServerBackend } from "./server-backend";

const REPO = "bogdanfinn/tls-client-api";

const READY_TIMEOUT_MS = 10_000;
const KILL_GRACE_MS = 3_000;
const HEALTH_POLL_MS = 150;

// Per-spawn temp dirs carry a pid file so the startup reaper can distinguish a
// live sibling instance from a dead one's leftover dir.
const PID_FILE = ".spawn.pid";
const STALE_MS = 60 * 60 * 1000; // 1h fallback for dirs with no readable pid file

const ASSET_MAP: PlatformMap = {
  darwin: {
    arm64: {
      name: "tls-client-api-darwin-arm64",
      downloadName: "tls-client-api-darwin-arm64-{version}",
    },
    x64: {
      name: "tls-client-api-darwin-amd64",
      downloadName: "tls-client-api-darwin-amd64-{version}",
    },
  },
  linux: {
    x64: {
      name: "tls-client-api-linux-amd64",
      downloadName: "tls-client-api-linux-amd64-{version}",
    },
  },
  win32: {
    x64: {
      name: "tls-client-api-windows-64.exe",
      downloadName: "tls-client-api-windows-64-{version}.exe",
    },
    ia32: {
      name: "tls-client-api-windows-32.exe",
      downloadName: "tls-client-api-windows-32-{version}.exe",
    },
  },
};

// Verbatim shape of bogdanfinn/tls-client-api's cmd/tls-client-api/config.dist.yml,
// with api/health/metadata ports and auth-key substituted per spawn.
const CONFIG_TEMPLATE = `env: dev

app_project: tls-client
app_family: tls-client
app_name: api

log:
  handlers:
    main:
      formatter: console
      level: info
      timestamp_format: '15:04:05:000'
      type: iowriter
      writer: stdout

sentry:
  dsn: ''
  release: ''
  tags:
    project: tls-client
    component: tls-client-api

api:
  port: {{PORT}}
  mode: release
  health:
    port: {{HEALTH_PORT}}
  timeout:
    read: 120s
    write: 120s
    idle: 120s

appctx:
  metadata:
    server:
      port: {{METADATA_PORT}}

api_auth_keys: [{{API_KEY}}]

api_cors_allowed_origin_pattern: ""
api_cors_allowed_headers: ["X-API-KEY", "X-API-VIEW", "Content-Type"]
api_cors_allowed_methods: ["POST", "GET", "PUT", "DELETE"]
`;

function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.unref();
    srv.once("error", reject);
    srv.listen(0, "127.0.0.1", () => {
      const { port } = srv.address() as net.AddressInfo;
      srv.close(() => resolve(port));
    });
  });
}

function assertPortFree(port: number, what: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.once("error", () =>
      reject(
        new TlsClientError(
          `managed spawn: port ${port} (${what}) is already in use.`,
        ),
      ),
    );
    srv.listen(port, "127.0.0.1", () => srv.close(() => resolve()));
  });
}

function assetInfo() {
  const { platform, arch } = process;

  if (platform === "linux" && fsSync.existsSync("/etc/alpine-release")) {
    throw new TlsClientError(
      "managed spawn: musl/alpine linux is unsupported (tls-client-api ships " +
        "a glibc-linked linux-amd64 binary only); use mode:'ffi' or an external server instead.",
    );
  }

  const info = ASSET_MAP[platform]?.[arch];
  if (!info) {
    throw new TlsClientError(
      `managed spawn: no prebuilt tls-client-api binary for ${platform}/${arch}; ` +
        "use mode:'ffi' or provide server.url instead.",
    );
  }
  return info;
}

async function resolveBinary(binaryPath?: string): Promise<string> {
  if (binaryPath) {
    const stat = await fs.stat(binaryPath).catch(() => null);
    if (!stat || !stat.isFile()) {
      throw new TlsClientError(
        `managed spawn: binaryPath "${binaryPath}" does not exist or is not a file.`,
      );
    }
    return binaryPath;
  }

  const info = assetInfo();
  const cacheDir = path.join(os.tmpdir(), "tls-client-api");
  await fs.mkdir(cacheDir, { recursive: true });
  const bin = path.join(cacheDir, info.name);
  const marker = bin + ".version";

  const exists = await fs
    .access(bin)
    .then(() => true)
    .catch(() => false);
  const cached = await fs
    .readFile(marker, "utf8")
    .then((v) => v.trim())
    .catch(() => null);

  // Keyed to the wrapper's own version, same as the FFI library cache — a
  // wrapper upgrade forces a one-time re-download.
  if (!exists || cached !== packageVersion) {
    const ok = await LibraryDownloader.retrieveLibrary(info, bin, REPO);
    if (!ok)
      throw new TlsClientError(
        "managed spawn: failed to download tls-client-api binary.",
      );
    if (process.platform !== "win32") await fs.chmod(bin, 0o755);
    await fs.writeFile(marker, packageVersion).catch(() => {});
  }

  return bin;
}

// Best-effort sweep of stale per-spawn temp dirs left by a prior process that
// died without running its exit/signal cleanup (SIGKILL, OOM-kill, host crash).
async function reapStaleDirs(): Promise<void> {
  const root = os.tmpdir();
  const entries = await fs.readdir(root).catch(() => [] as string[]);
  await Promise.all(
    entries
      .filter((name) => name.startsWith("tls-client-api-"))
      .map(async (name) => {
        const dir = path.join(root, name);
        const pidText = await fs
          .readFile(path.join(dir, PID_FILE), "utf8")
          .catch(() => null);
        const pid = pidText ? Number(pidText.trim()) : NaN;

        if (Number.isInteger(pid)) {
          try {
            process.kill(pid, 0);
            return;
          } catch {
            /* not running — fall through to remove */
          }
        } else {
          // No readable pid file yet (still starting, or a foreign/older
          // layout) — age fallback.
          const stat = await fs.stat(dir).catch(() => null);
          if (stat && Date.now() - stat.mtimeMs < STALE_MS) return;
        }
        await fs.rm(dir, { recursive: true, force: true }).catch(() => {});
      }),
  );
}

function waitHealthy(healthPort: number): Promise<void> {
  const deadline = Date.now() + READY_TIMEOUT_MS;
  return new Promise((resolve, reject) => {
    const attempt = () => {
      const req = http.get(
        { host: "127.0.0.1", port: healthPort, path: "/health", timeout: 1000 },
        (res) => {
          res.resume();
          if (res.statusCode === 200) resolve();
          else retryOrFail();
        },
      );
      req.on("timeout", () => req.destroy());
      req.on("error", retryOrFail);

      function retryOrFail() {
        if (Date.now() > deadline) {
          reject(
            new TlsClientError(
              "managed spawn: tls-client-api did not become healthy in time.",
            ),
          );
        } else {
          setTimeout(attempt, HEALTH_POLL_MS);
        }
      }
    };
    attempt();
  });
}

export class ManagedServerBackend implements Backend {
  private readonly inner: ServerBackend;
  private readonly proc: ChildProcess;
  private readonly tmpDir: string;
  private cleanedUp = false;
  private exited = false;

  private constructor(
    inner: ServerBackend,
    proc: ChildProcess,
    tmpDir: string,
  ) {
    this.inner = inner;
    this.proc = proc;
    this.tmpDir = tmpDir;
    this.proc.once("exit", () => {
      this.exited = true;
    });
    process.once("exit", this.onHostExit);
    process.once("SIGINT", this.onHostSignal);
    process.once("SIGTERM", this.onHostSignal);
  }

  private cleanup(): void {
    if (this.cleanedUp) return;
    this.cleanedUp = true;
    try {
      this.proc.kill("SIGKILL");
    } catch {}
    try {
      fsSync.rmSync(this.tmpDir, { recursive: true, force: true });
    } catch {}
  }

  private readonly onHostExit = () => this.cleanup();

  private readonly onHostSignal = (signal: NodeJS.Signals) => {
    this.cleanup();
    process.removeListener(signal, this.onHostSignal);
    // Re-raise only if we were the sole listener — otherwise a host app's own
    // SIGINT/SIGTERM handler owns the exit, and re-raising would double-fire it.
    if (process.listenerCount(signal) === 0) process.kill(process.pid, signal);
  };

  static async create(opts: {
    port?: number;
    binaryPath?: string;
    apiKey?: string;
    concurrency?: number;
    showOutput?: boolean;
  }): Promise<ManagedServerBackend> {
    await reapStaleDirs();

    if (opts.port !== undefined) await assertPortFree(opts.port, "server.port");

    const bin = await resolveBinary(opts.binaryPath);
    const [port, healthPort, metadataPort] = await Promise.all([
      opts.port !== undefined ? Promise.resolve(opts.port) : freePort(),
      freePort(),
      freePort(),
    ]);
    const apiKey = opts.apiKey ?? crypto.randomBytes(16).toString("hex");

    const config = CONFIG_TEMPLATE.replace("{{PORT}}", () => String(port))
      .replace("{{HEALTH_PORT}}", () => String(healthPort))
      .replace("{{METADATA_PORT}}", () => String(metadataPort))
      .replace("{{API_KEY}}", () => JSON.stringify(apiKey));

    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "tls-client-api-"));
    await fs.writeFile(path.join(tmpDir, "config.dist.yml"), config);

    // Hardlink (not copy) the resolved binary — same filesystem (os.tmpdir()),
    // so it's ~free and shares the inode/permissions. main2.go resolves its
    // config from filepath.Dir(os.Executable()), so each spawn needs its own
    // dir; a hardlink has no target to resolve (unlike a symlink, which Linux
    // /proc/self/exe would collapse back to the shared cache path).
    const linkedBin = path.join(tmpDir, path.basename(bin));
    await fs.link(bin, linkedBin);
    // showOutput inherits stdout/stderr straight into this process's terminal —
    // the child's own console output, unfiltered. Default pipes stderr through
    // our logger instead and discards stdout.
    const proc = spawn(linkedBin, [], {
      cwd: tmpDir,
      stdio: opts.showOutput
        ? ["ignore", "inherit", "inherit"]
        : ["ignore", "ignore", "pipe"],
    });

    // Written right after spawn() returns, so the reaper can attribute this dir
    // to a live pid before any sibling create() could plausibly sweep it.
    await fs
      .writeFile(path.join(tmpDir, PID_FILE), String(proc.pid ?? ""))
      .catch(() => {});

    proc.stderr?.on("data", (d) =>
      logger.debug(`tls-client-api: ${d.toString().trim()}`),
    );
    // Permanent listener: any error AFTER readiness (nothing awaiting the race
    // below by then) is logged, not thrown — an unhandled 'error' on a
    // ChildProcess would otherwise crash the host process.
    proc.on("error", (e) => logger.error(`tls-client-api: ${e.message}`));

    const spawnError = new Promise<never>((_, reject) =>
      proc.once("error", reject),
    );
    const spawnExit = new Promise<never>((_, reject) =>
      proc.once("exit", (code, signal) =>
        reject(
          new TlsClientError(
            `managed spawn: tls-client-api exited before becoming healthy (code=${code}, signal=${signal}).`,
          ),
        ),
      ),
    );

    try {
      await Promise.race([waitHealthy(healthPort), spawnError, spawnExit]);
    } catch (e) {
      proc.kill("SIGKILL");
      await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
      throw e instanceof TlsClientError
        ? e
        : new TlsClientError(e instanceof Error ? e : String(e));
    }

    const inner = new ServerBackend({
      url: `http://127.0.0.1:${port}`,
      apiKey,
      concurrency: opts.concurrency,
    });

    return new ManagedServerBackend(inner, proc, tmpDir);
  }

  request(payload: string): Promise<string> {
    return this.inner.request(payload);
  }

  destroySession(payload: string): Promise<string> {
    return this.inner.destroySession(payload);
  }

  freeMemory(_id: string): Promise<void> {
    return this.inner.freeMemory();
  }

  destroyAll(): Promise<string> {
    return this.inner.destroyAll();
  }

  async destroy(): Promise<void> {
    this.cleanedUp = true; // prevents the exit/signal handlers from racing this graceful path
    process.removeListener("exit", this.onHostExit);
    process.removeListener("SIGINT", this.onHostSignal);
    process.removeListener("SIGTERM", this.onHostSignal);
    await this.inner.destroy();

    if (!this.exited) {
      await new Promise<void>((resolve) => {
        const timer = setTimeout(
          () => this.proc.kill("SIGKILL"),
          KILL_GRACE_MS,
        );
        this.proc.once("exit", () => {
          clearTimeout(timer);
          resolve();
        });
        this.proc.kill("SIGTERM");
      });
    }
    await fs.rm(this.tmpDir, { recursive: true, force: true }).catch(() => {});
  }
}
