/**
 * Counting semaphore with an unbounded FIFO wait queue (= Piscina
 * `maxQueue: Infinity` parity). Keeps in-flight koffi async calls ≤ permits so
 * koffi's `max_async_calls` ceiling is never hit.
 */
export class Semaphore {
  private queue: Array<() => void> = [];
  private outstanding = 0;
  private drainWaiters: Array<() => void> = [];

  constructor(private permits: number) {}

  acquire(): Promise<void> {
    this.outstanding++;
    if (this.permits > 0) {
      this.permits--;
      return Promise.resolve();
    }
    return new Promise((resolve) => this.queue.push(resolve));
  }

  release(): void {
    this.outstanding--;
    const next = this.queue.shift();
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
}
