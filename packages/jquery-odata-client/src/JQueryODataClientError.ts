/// <reference path="../../../node_modules/@types/jquery/misc.d.ts" />

export class JQueryODataClientError extends Error {
  name = "JQueryODataClientError";
  isJQueryODataClientError = true;
  cause?: JQuery.jqXHR;
  constructor(msg: string, options?: { cause?: JQuery.jqXHR }) {
    super(msg, options);
  }
}
