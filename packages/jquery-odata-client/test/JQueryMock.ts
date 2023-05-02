import * as crypto from "crypto";
import AjaxSettings = JQuery.AjaxSettings;

function createMockXhr(status: number, statusText: string, data: any, headers: { [k: string]: string } | undefined) {
  const respHeaders = !headers
    ? ""
    : Object.entries(headers)
        .map(([key, value]) => `${key.toLowerCase()}: ${value}\r\n`)
        .join("");

  return {
    status,
    statusText,
    getResponseHeader: (name: string) => (headers ? headers[name] : undefined),
    getAllResponseHeaders: () => respHeaders,
    responseJSON: () => data,
  };
}

export class JqMock {
  private requestConfig: AjaxSettings | undefined;
  private responseData: any;
  private responseHeaders: { [k: string]: string } | undefined;
  private responseStatus: number | undefined;
  private isSuccessResponse: boolean | undefined;
  private csrfToken: string | undefined;
  private expiredCsrfToken: boolean = false;

  /**
   * Marks the next request as success response
   */
  public successResponse(data: any = {}, headers?: { [k: string]: string }) {
    this.isSuccessResponse = true;
    this.responseData = data;
    this.responseHeaders = headers;
  }

  /**
   * Marks the next request as error response
   */
  public errorResponse(httpCode: number, body: any, headers?: { [k: string]: string }) {
    this.isSuccessResponse = false;
    this.responseData = body;
    this.responseHeaders = headers;
    this.responseStatus = httpCode;
  }

  public simulateExpiredCsrfToken() {
    this.expiredCsrfToken = true;
  }

  public ajax(settings: JQuery.AjaxSettings) {
    this.requestConfig = settings;

    // CSRF handling
    if (settings.headers && settings.headers["x-csrf-token"] === "Fetch") {
      this.csrfToken = crypto.randomBytes(4).toString("hex");
      // @ts-ignore
      this.requestConfig.success({}, "OK", createMockXhr(200, "OK", {}, { "x-csrf-token": this.csrfToken }));

      return;
    }

    // Simulating expired CSRF token
    if (this.expiredCsrfToken) {
      const mockXhr = createMockXhr(403, "err", {}, { "x-csrf-token": "Required" });
      // @ts-ignore
      this.requestConfig.error(mockXhr, mockXhr.statusText, "thrown error");

      this.expiredCsrfToken = false;
      return;
    }

    if (typeof this.isSuccessResponse === "undefined") {
      throw new Error("JQueryMock expects you to call successResponse() or errorResponse() first!");
    }

    if (this.isSuccessResponse) {
      const mockXhr = createMockXhr(200, "OK", this.responseData, this.responseHeaders);
      // @ts-ignore => too powerful typing of jquery here; also allows for arrays of functions
      this.requestConfig.success(this.responseData, mockXhr.statusText, mockXhr);
    } else {
      const mockXhr = createMockXhr(this.responseStatus!, "err", this.responseData, this.responseHeaders);
      // @ts-ignore
      this.requestConfig.error(mockXhr, mockXhr.statusText, "thrown error");
    }

    this.isSuccessResponse = undefined;
    this.responseData = undefined;
    this.responseHeaders = undefined;
  }

  public getRequestConfig() {
    return this.requestConfig;
  }

  public getCsrfToken() {
    return this.csrfToken;
  }
}
