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
  }

  /** `error` unchanged when it already is a `TlsClientError`, wrapped otherwise. */
  static from(error: unknown): TlsClientError {
    if (error instanceof TlsClientError) return error;
    return new TlsClientError(error instanceof Error ? error : String(error));
  }
}

/** The message of a caught value, whether or not it is an `Error`. */
export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
