export class TlsClientError extends Error {
  constructor(message: string | Error) {
    super(
      message instanceof Error ? message.message : message,
      message instanceof Error ? { cause: message } : undefined,
    );
    if (message instanceof Error && message.stack) {
      this.stack = message.stack;
    }
    this.name = "TlsClientError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
