import { TlsClientError } from "../../utils/tlsError";

/**
 * Counting semaphore with an unbounded FIFO wait queue (Piscina
 * `maxQueue: Infinity` parity). Keeps in-flight koffi async calls ≤ permits so
 * koffi's `max_async_calls` ceiling is never hit. `close()` stops admitting new
 * callers (they reject) while already-queued ones still run.
 */
export class Semaphore {
  /** Queued waiters live at `queue[head..]`; consumed slots are compacted away lazily. */
  private queue: Array<(() => void) | undefined> = [];
  private head = 0;
  private outstanding = 0;
  private drainWaiters: Array<() => void> = [];
  private closing = false;

  constructor(private permits: number) {}

  acquire(): Promise<void> {
    if (this.closing) {
      return Promise.reject(
        new TlsClientError(
          "tls client is shutting down (destroyTLS() was called)",
        ),
      );
    }
    this.outstanding++;
    if (this.permits > 0) {
      this.permits--;
      return Promise.resolve();
    }
    return new Promise((resolve) => this.queue.push(resolve));
  }

  release(): void {
    this.outstanding--;
    const next = this.dequeue();
    // Hand the permit directly to the waiter (don't increment then decrement).
    if (next) next();
    else this.permits++;

    if (this.outstanding === 0) {
      const waiters = this.drainWaiters;
      this.drainWaiters = [];
      waiters.forEach((resolve) => resolve());
    }
  }

  /** Resolves once every acquired (running or still-queued) call has released. */
  drain(): Promise<void> {
    if (this.outstanding === 0) return Promise.resolve();
    return new Promise((resolve) => this.drainWaiters.push(resolve));
  }

  /** Reject all future `acquire()`s, then wait for everything already admitted. */
  close(): Promise<void> {
    this.closing = true;
    return this.drain();
  }

  /** O(1) amortized, unlike `Array.shift()`, which is O(n) on large queues. */
  private dequeue(): (() => void) | undefined {
    if (this.head === this.queue.length) return undefined;
    const next = this.queue[this.head];
    this.queue[this.head++] = undefined;
    if (this.head === this.queue.length) {
      this.queue = [];
      this.head = 0;
    } else if (this.head >= 1024 && this.head * 2 >= this.queue.length) {
      this.queue = this.queue.slice(this.head);
      this.head = 0;
    }
    return next;
  }
}
