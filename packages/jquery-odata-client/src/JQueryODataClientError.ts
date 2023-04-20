/// <reference path="../../../node_modules/@types/jquery/misc.d.ts" />

export class JQueryODataClientError extends Error {
  name = "JQueryODataClientError";
  status?: number;
  cause?: JQuery.jqXHR;
  constructor(msg: string, status?: number, options?: { cause?: JQuery.jqXHR }) {
    super(msg, options);
    this.status = status;
  }
}
