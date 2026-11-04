import https from "https";
import http, { IncomingMessage } from "http";
import { createWriteStream } from "fs";
import fs from "fs/promises";
import { pipeline } from "stream/promises";
import { TlsClientError, errorMessage, exists, logger } from "../../utils";

/** `https.request`-shaped function; injectable for tests. */
export type HttpRequest = (
  url: string,
  options: https.RequestOptions,
  callback: (res: IncomingMessage) => void,
) => http.ClientRequest;

export interface DownloaderOptions {
  /** GitHub `owner/name`. Default: `bogdanfinn/tls-client`. */
  repo?: string;
  request?: HttpRequest;
}

/**
 * Downloads a release asset from GitHub without touching the REST API (which
 * is rate-limited to 60 requests/hour per IP for anonymous callers):
 * `releases/latest` redirects to `releases/tag/<tag>`, and
 * `releases/download/<tag>/<asset>` redirects to the file (404 when absent).
 */
export class ReleaseDownloader {
  private static readonly ISSUES_URL =
    "https://github.com/Sahil1337/node-tls-client/issues";
  private static readonly MAX_REDIRECTS = 8;
  /** Socket idle timeout: a stalled connection fails initTLS() instead of hanging it. */
  private static readonly TIMEOUT_MS = 30_000;
  private static readonly OPTIONS = {
    headers: { "user-agent": "node-tls-client" },
    timeout: ReleaseDownloader.TIMEOUT_MS,
  };

  private readonly repo: string;
  private readonly request: HttpRequest;

  constructor(options: DownloaderOptions = {}) {
    this.repo = options.repo ?? "bogdanfinn/tls-client";
    this.request = options.request ?? https.request;
  }

  /**
   * Resolve the latest release, try each of `assetNames` in order (`{version}`
   * is substituted), and place the first one found at `dest` (written to a
   * temp file and renamed, so concurrent processes never see a partial file).
   * Throws `TlsClientError` when nothing could be downloaded.
   */
  async download(
    assetNames: string[],
    dest: string,
  ): Promise<{ tag: string; asset: string }> {
    const tag = await this.latestTag();
    const version = tag.replace(/^v/, "");
    logger.debug(`Latest ${this.repo} release: ${tag}`);

    const tried: string[] = [];
    for (const template of assetNames) {
      const asset = template.replace("{version}", version);
      tried.push(asset);
      const url = `https://github.com/${this.repo}/releases/download/${tag}/${asset}`;
      if (await this.downloadTo(url, dest)) {
        logger.success(`Downloaded ${asset} (${tag}).`);
        return { tag, asset };
      }
    }
    throw new TlsClientError(
      `No shared library for ${process.platform}/${process.arch} in ${this.repo} ${tag}; tried ${tried.join(", ")}. Report ${logger.hyperlink("here", ReleaseDownloader.ISSUES_URL)}.`,
    );
  }

  private async latestTag(): Promise<string> {
    let res: IncomingMessage;
    try {
      res = await this.send(
        "HEAD",
        `https://github.com/${this.repo}/releases/latest`,
      );
    } catch (e) {
      throw new TlsClientError(
        `Could not resolve the latest ${this.repo} release: ${errorMessage(e)}`,
      );
    }
    res.resume();
    const location = res.headers.location;
    const match = location && /\/releases\/tag\/([^/?#]+)/.exec(location);
    if (!match) {
      throw new TlsClientError(
        `Could not resolve the latest ${this.repo} release (status ${res.statusCode}${location ? `, location ${location}` : ""}).`,
      );
    }
    return decodeURIComponent(match[1]);
  }

  /** Resolves `false` when the asset does not exist (404), `true` once saved. */
  private async downloadTo(url: string, dest: string): Promise<boolean> {
    const tmp = `${dest}.${process.pid}.tmp`;
    try {
      const res = await this.getFollowingRedirects(url);
      if (res.statusCode === 404) {
        res.resume();
        return false;
      }
      if (!res.statusCode || res.statusCode < 200 || res.statusCode >= 300) {
        res.resume();
        throw new TlsClientError(
          `Download failed [status ${res.statusCode}] for ${url}`,
        );
      }
      await ReleaseDownloader.saveTo(res, tmp);
      try {
        await fs.rename(tmp, dest);
      } catch (e) {
        // Another process finished the same download first (Windows refuses
        // to replace a mapped file): its copy is as good as ours.
        if (!(await exists(dest))) throw e;
      }
      return true;
    } catch (e) {
      await fs.rm(tmp, { force: true }).catch(() => {});
      throw TlsClientError.from(e);
    }
  }

  private async getFollowingRedirects(url: string): Promise<IncomingMessage> {
    for (let hops = 0; ; hops++) {
      const res = await this.send("GET", url);
      const status = res.statusCode ?? 0;
      const location = res.headers.location;
      if (status < 300 || status >= 400 || !location) return res;
      res.resume();
      if (hops >= ReleaseDownloader.MAX_REDIRECTS) {
        throw new TlsClientError(`Too many redirects for ${url}`);
      }
      url = new URL(location, url).toString();
    }
  }

  /**
   * One bodiless request; resolves with the response, redirects not followed.
   * The `error` listener stays attached after the response arrives, so a
   * socket error mid-body (#16) is never an unhandled `error` event; Node
   * destroys the response, which fails the pipeline reading it.
   */
  private send(method: "GET" | "HEAD", url: string): Promise<IncomingMessage> {
    return new Promise((resolve, reject) => {
      const req = this.request(
        url,
        { method, ...ReleaseDownloader.OPTIONS },
        resolve,
      );
      req.on("timeout", () =>
        req.destroy(
          new TlsClientError(
            `Timed out after ${ReleaseDownloader.TIMEOUT_MS / 1000}s waiting for ${url}`,
          ),
        ),
      );
      req.on("error", reject);
      req.end();
    });
  }

  /** Resolves only once the file descriptor is closed (rename/dlopen-safe). */
  private static async saveTo(res: IncomingMessage, tmp: string) {
    const total = parseInt(res.headers["content-length"] || "0", 10);
    if (process.stdout.isTTY && total > 0) {
      let done = 0;
      res.on("data", (chunk: Buffer) => {
        done += chunk.length;
        logger.progress(done, total);
      });
    }
    await pipeline(res, createWriteStream(tmp));
  }
}
