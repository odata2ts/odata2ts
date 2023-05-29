export class FetchODataClientError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly cause?: Error,
    public readonly response?: Response
  ) {
    // @ts-ignore: fetch requires lib "dom" or "webworker", but then the "cause" property becomes unknown to TS
    super(message, { cause });
    this.name = this.constructor.name;
  }
}
