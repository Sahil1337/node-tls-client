import https from "https";
import http, { IncomingMessage } from "http";
import { createWriteStream } from "fs";
import fsp from "fs/promises";
import * as readline from "readline";
import { pipeline } from "stream/promises";
import { FileInfo } from "../interface/native";
import { TlsClientError } from "./tlsError";
import { logger } from "./logger";

/** `https.request`-shaped function; injectable for tests. */
export type HttpRequest = (
  url: string,
  options: https.RequestOptions,
  callback: (res: IncomingMessage) => void,
) => http.ClientRequest;

/**
 * Downloads a release asset from GitHub without touching the REST API (which
 * is rate-limited to 60 requests/hour per IP for anonymous callers):
 * `releases/latest` redirects to `releases/tag/<tag>`, and
 * `releases/download/<tag>/<asset>` redirects to the file (404 when absent).
 */
export class LibraryDownloader {
  private static readonly issueURL =
    "https://github.com/Sahil1337/node-tls-client/issues";
  private static readonly MAX_REDIRECTS = 8;
  private static readonly HEADERS = { "user-agent": "node-tls-client" };
  /** Socket idle timeout: a stalled connection fails initTLS() instead of hanging it. */
  private static readonly TIMEOUT_MS = 30_000;
  private static readonly OPTIONS = {
    headers: LibraryDownloader.HEADERS,
    timeout: LibraryDownloader.TIMEOUT_MS,
  };

  private static onTimeout(req: http.ClientRequest, url: string): void {
    req.on("timeout", () =>
      req.destroy(
        new TlsClientError(
          `Timed out after ${LibraryDownloader.TIMEOUT_MS / 1000}s waiting for ${url}`,
        ),
      ),
    );
  }

  /**
   * Resolve the latest release of `repo`, try each of `file.downloadNames`
   * in order, and place the first one found at `libPath` (written to a temp
   * file and renamed, so concurrent processes never see a partial file).
   * Throws `TlsClientError` when nothing could be downloaded.
   */
  static async retrieveLibrary(
    file: FileInfo,
    libPath: string,
    repo = "bogdanfinn/tls-client",
    request: HttpRequest = https.request,
  ): Promise<{ tag: string; asset: string }> {
    const tag = await this.resolveLatestTag(repo, request);
    const version = tag.replace(/^v/, "");
    logger.debug(`Latest ${repo} release: ${tag}`);

    const tried: string[] = [];
    for (const template of file.downloadNames) {
      const asset = template.replace("{version}", version);
      tried.push(asset);
      const url = `https://github.com/${repo}/releases/download/${tag}/${asset}`;
      if (await this.downloadTo(url, libPath, request)) {
        logger.success(`Downloaded ${asset} (${tag}).`);
        return { tag, asset };
      }
    }
    throw new TlsClientError(
      `No shared library for ${process.platform}/${process.arch} in ${repo} ${tag}; tried ${tried.join(", ")}. Report ${logger.hyperlink("here", this.issueURL)}.`,
    );
  }

  private static resolveLatestTag(
    repo: string,
    request: HttpRequest,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const req = request(
        `https://github.com/${repo}/releases/latest`,
        { method: "HEAD", ...LibraryDownloader.OPTIONS },
        (res) => {
          res.resume();
          const location = res.headers.location;
          const match = location && /\/releases\/tag\/([^/?#]+)/.exec(location);
          if (match) resolve(decodeURIComponent(match[1]));
          else
            reject(
              new TlsClientError(
                `Could not resolve the latest ${repo} release (status ${res.statusCode}${location ? `, location ${location}` : ""}).`,
              ),
            );
        },
      );
      LibraryDownloader.onTimeout(
        req,
        `https://github.com/${repo}/releases/latest`,
      );
      req.on("error", (e) =>
        reject(
          new TlsClientError(
            `Could not resolve the latest ${repo} release: ${e.message}`,
          ),
        ),
      );
      req.end();
    });
  }

  /** Resolves `false` when the asset does not exist (404), `true` once saved. */
  private static async downloadTo(
    url: string,
    dest: string,
    request: HttpRequest,
  ): Promise<boolean> {
    const tmp = `${dest}.${process.pid}.tmp`;
    try {
      const res = await this.getFollowingRedirects(url, request);
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
      await this.saveTo(res, tmp);
      try {
        await fsp.rename(tmp, dest);
      } catch (e) {
        // Another process finished the same download first (Windows refuses
        // to replace a mapped file): its copy is as good as ours.
        if (!(await fsp.stat(dest).catch(() => null))) throw e;
      }
      return true;
    } catch (e) {
      await fsp.rm(tmp, { force: true }).catch(() => {});
      throw e instanceof TlsClientError ? e : new TlsClientError(e as Error);
    }
  }

  private static getFollowingRedirects(
    url: string,
    request: HttpRequest,
    hops = 0,
  ): Promise<IncomingMessage> {
    return new Promise((resolve, reject) => {
      const req = request(
        url,
        { method: "GET", ...LibraryDownloader.OPTIONS },
        (res) => {
          const status = res.statusCode ?? 0;
          if (status >= 300 && status < 400 && res.headers.location) {
            res.resume();
            if (hops >= LibraryDownloader.MAX_REDIRECTS) {
              reject(new TlsClientError(`Too many redirects for ${url}`));
              return;
            }
            const next = new URL(res.headers.location, url).toString();
            this.getFollowingRedirects(next, request, hops + 1).then(
              resolve,
              reject,
            );
          } else {
            resolve(res);
          }
        },
      );
      LibraryDownloader.onTimeout(req, url);
      req.on("error", reject);
      req.end();
    });
  }

  /** Resolves only once the file descriptor is closed (rename/dlopen-safe). */
  private static async saveTo(
    res: IncomingMessage,
    tmp: string,
  ): Promise<void> {
    const total = parseInt(res.headers["content-length"] || "0", 10);
    const showProgress = Boolean(process.stdout.isTTY) && total > 0;
    let downloaded = 0;
    if (showProgress) {
      res.on("data", (chunk: Buffer) => {
        downloaded += chunk.length;
        this.progress(downloaded, total);
      });
    }
    await pipeline(res, createWriteStream(tmp));
    if (showProgress) process.stdout.write("\n");
  }

  private static formatBytes(bytes: number, decimals = 2): string {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  }

  private static progress(downloaded: number, total: number) {
    const percentage = (downloaded / total) * 100;
    const progress = Math.min(50, Math.floor(percentage / 2));
    const bar = "█".repeat(progress) + " ".repeat(50 - progress);
    readline.clearLine(process.stdout, 0);
    readline.cursorTo(process.stdout, 0);
    process.stdout.write(
      `${logger.stamp} DOWNLOADING:[${bar}] ${percentage.toFixed(
        2,
      )}% (${this.formatBytes(downloaded)} / ${this.formatBytes(total)})`,
    );
  }
}
