export class FetchODataClientError extends Error {
  constructor(msg: string, public status?: number, cause?: Error, public response?: Response) {
    // @ts-ignore: fetch requires lib "dom" or "webworker", but then the "cause" property becomes unknown to TS
    super(msg, { cause });
    this.name = this.constructor.name;
  }
}
