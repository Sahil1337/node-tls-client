import os from "os";
import { logger } from "./logger";
import https from "https";
import fs, { WriteStream, createWriteStream } from "fs";
import { IncomingMessage } from "http";

export class Download {
  private temp: string = os.tmpdir();
  private file: { name: string; downloadName: string };
  private path: string;
  private issueURL: string =
    "https://github.com/Sahil1337/node-tls-client/issues";

  constructor(file: { name: string; downloadName: string }, libPath: string) {
    this.file = file;
    this.path = libPath;
  }

  async init() {
    try {
      const latest = await this.getLatest();
      if (latest) {
        await this.extract(latest.browser_download_url);
        logger.success("Extracted shared library.");
      } else {
        logger.error(
          `Failed to find required asset: ${
            this.file.name
          }, report ${logger.hyperlink("here", this.issueURL)}.`
        );
      }
    } catch (error) {
      logger.error(`Initialization failed: ${error}`);
    }
  }

  private formatBytes(bytes: number, decimals = 2): string {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  }

  private progress(downloaded: number, total: number) {
    const percentage = (downloaded / total) * 100;
    const progress = Math.floor(percentage / 2);
    const bar = "█".repeat(progress) + " ".repeat(50 - progress);
    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);
    process.stdout.write(
      `${logger.stamp} DOWNLOADING:[${bar}] ${percentage.toFixed(
        2
      )}% (${this.formatBytes(downloaded)} / ${this.formatBytes(total)})`
    );
  }

  private async download(url: string, file: WriteStream): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      https
        .get(url, (response: IncomingMessage) => {
          if (
            response.statusCode &&
            response.statusCode >= 300 &&
            response.statusCode < 400 &&
            response.headers.location
          ) {
            const newURL = new URL(response.headers.location, url).toString();
            logger.debug(
              `Fetched shared library ${logger.hyperlink("url", newURL)}`
            );
            this.download(newURL, file).then(resolve).catch(reject);
          } else if (
            response.statusCode &&
            response.statusCode >= 200 &&
            response.statusCode < 300
          ) {
            const totalBytes = parseInt(
              response.headers["content-length"] || "0",
              10
            );
            let downloadedBytes = 0;

            response.pipe(file);

            response.on("data", (chunk) => {
              downloadedBytes += chunk.length;
              this.progress(downloadedBytes, totalBytes);
            });

            response.on("end", () => {
              file.close((err) => {
                if (err) {
                  reject(err);
                } else {
                  process.stdout.write("\n"); // Ensure a new line after the progress bar
                  resolve();
                }
              });
            });

            file.on("error", (err) => {
              fs.unlink(this.path, () => reject(err));
            });
          } else {
            logger.error(
              `Failed to download the file [statusCode:${response.statusCode}]`
            );
            reject();
          }
        })
        .on("error", (err) => {
          fs.unlink(this.path, () => reject(err));
        });
    });
  }

  private async extract(url: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const file = createWriteStream(this.path);
      this.download(url, file).then(resolve).catch(reject);
    });
  }

  private async getLatest(): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      const options = {
        hostname: "api.github.com",
        path: "/repos/bogdanfinn/tls-client/releases/latest",
        method: "GET",
        headers: {
          "user-agent": "node-tls-client",
        },
      };

      https
        .get(options, (res: IncomingMessage) => {
          let data = "";

          res.on("data", (chunk) => {
            data += chunk;
          });

          res.on("end", () => {
            if (res.statusCode === 200) {
              try {
                const response = JSON.parse(data);
                const version = response.tag_name.replace("v", "");
                logger.debug(`Fetched latest version: v${version}`);

                const assetName = this.file.downloadName.replace(
                  "{version}",
                  version
                );
                const asset = response.assets.find(
                  (asset: { name: string }) => asset.name === assetName
                );

                if (!asset) {
                  logger.error(
                    `Failed to find required asset: ${
                      this.file.name
                    }, report ${logger.hyperlink("here", this.issueURL)}.`
                  );
                  resolve(null);
                } else {
                  resolve(asset);
                }
              } catch (err) {
                logger.error(`Failed to parse response: ${err}`);
                resolve(null);
              }
            } else {
              logger.error(
                `Failed to fetch the latest version. Status code: ${res.statusCode}`
              );
              resolve(null);
            }
          });
        })
        .on("error", (err) => {
          logger.error(`Failed to fetch the latest version: ${err}`);
          resolve(null);
        });
    });
  }
}
