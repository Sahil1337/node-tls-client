import { ClientLimits } from "../../types/client";
import {
  TlsCompletion,
  TlsNativeLibrary,
  TlsNativeQueue,
} from "../../types/native";
import { TlsClientError, logger } from "../../utils";
import { NativeClient } from "./native-client";

/** Bindings of a binary that has the completion queue. */
export type QueueLibrary = TlsNativeLibrary & { queue: TlsNativeQueue };

/**
 * node-tls-client's binary: a request runs on a goroutine and holds no
 * thread or koffi slot; native calls back when requests have finished, and
 * each is handed to its caller. Nothing is capped, like node-fetch: the gate
 * only tracks what is in flight, so destroyTLS() can wait for it.
 */
export class QueueClient extends NativeClient {
  /** How often `recheck` asks native to look again while callers wait. */
  private static readonly RECHECK_MS = 250;

  private readonly queue: TlsNativeQueue;
  /** Callers waiting for a response, by ticket. */
  private readonly waiting = new Map<
    number,
    { resolve: (raw: string) => void; reject: (e: Error) => void }
  >();
  private readonly onReady = () => this.drain();
  /**
   * Runs only while callers wait. It keeps the process alive (koffi's
   * callback from native doesn't, so Node would exit before responses come),
   * and every RECHECK_MS it re-installs the handler, which makes native
   * check for uncollected responses and call back if there are any: a safety
   * net, so a lost callback costs a delay, not a hang. It never collects
   * responses itself: emptying `waiting` outside a callback could let Node
   * exit while native is already calling in, which koffi aborts on.
   */
  private recheck: NodeJS.Timeout | null = null;

  constructor(lib: QueueLibrary) {
    super(lib, Infinity);
    this.queue = lib.queue;
    this.queue.onReady(this.onReady);
  }

  static fromLimits(
    lib: QueueLibrary,
    { requested }: ClientLimits,
  ): QueueClient {
    if (requested !== undefined) {
      logger.warnOnce(
        "queue-concurrency",
        "initTLS({ concurrency }) has no effect with node-tls-client's binary: every request runs at once, like node-fetch. To limit requests in flight, cap them in your code.",
      );
    }
    return new QueueClient(lib);
  }

  override async close(): Promise<void> {
    try {
      await super.close();
    } finally {
      // Nothing is in flight now; a later initTLS() installs its own handler.
      this.queue.onReady(null);
      this.stopRecheck();
    }
  }

  /** Starts the request and waits for native to report it finished. */
  protected send(json: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.waiting.set(this.queue.requestAsync(json), { resolve, reject });
      this.recheck ??= setInterval(
        () => this.queue.onReady(this.onReady),
        QueueClient.RECHECK_MS,
      );
    });
  }

  /**
   * Native's callback: collect everything that has finished, without
   * blocking. A request finishing meanwhile gets a callback of its own, so
   * stopping at the first empty poll misses nothing.
   */
  private drain(): void {
    try {
      let next = this.queue.waitNext(0);
      while (next) {
        this.settle(next);
        next = this.queue.waitNext(0);
      }
    } catch (e) {
      // koffi itself failed; request errors arrive as responses. What this
      // drain didn't collect may never be, so fail every waiting caller.
      const error = TlsClientError.from(e);
      for (const { reject } of this.waiting.values()) reject(error);
      this.waiting.clear();
    }
    if (this.waiting.size === 0) this.stopRecheck();
  }

  private stopRecheck(): void {
    if (this.recheck) clearInterval(this.recheck);
    this.recheck = null;
  }

  private settle({ ticket, response }: TlsCompletion): void {
    const waiter = this.waiting.get(ticket);
    if (!waiter) {
      // Its caller was already failed by a koffi error: just free the reply.
      this.free(QueueClient.replyId(response));
      return;
    }
    this.waiting.delete(ticket);
    waiter.resolve(response);
  }
}
