import {
  ConcurrencyHandler,
  ODataHttpClient,
  ODataHttpMethods,
  ODataRequestConfig,
  ODataResponse,
} from "@odata2ts/http-client-api";

export interface MockRequestConfig extends ODataRequestConfig {
  test: string;
}

/**
 * The ETag store of a {@link MockClient}, with its contents exposed so a test can arrange and assert it.
 *
 * Hand-rolled rather than borrowed from `@odata2ts/http-client-common`: what is under test here is
 * `odata-service` against the {@link ConcurrencyHandler} *contract*, and depending on one particular
 * implementation of it would blur that - besides making a client package a dependency of this one.
 */
export class MockConcurrencyHandler implements ConcurrencyHandler {
  public readonly store = new Map<string, string>();
  /** Resolve an unknown key to `*` instead of nothing - see `blindConcurrencyWrites`. */
  public blindWrites = false;

  public set(key: string, etag: string): void {
    this.store.set(key, etag);
  }

  public evict(key: string): void {
    this.store.delete(key);
  }

  public resolve(key: string): string | undefined {
    return this.store.get(key) ?? (this.blindWrites ? "*" : undefined);
  }
}
/**
 * Mock for an ODataHttpClient.
 * Use `client.lastUrl` or `client.lastData` to acces passed data.
 */
export class MockClient implements ODataHttpClient<MockRequestConfig> {
  public lastUrl?: string;
  public lastData?: any;
  public lastOperation?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** The MIME type of the last blob operation - only those carry one. */
  public lastMimeType?: string;
  public lastRequestConfig?: MockRequestConfig;
  public additionalHeaders?: Record<string, string>;

  public responseData?: any;

  /** How many requests actually reached this client - a write refused before sending must add none. */
  public requestCount = 0;
  /** The status the next response carries; 204 is the interesting one for optimistic concurrency. */
  public responseStatus = 200;
  /** The headers the next response carries, e.g. `{ etag: 'W/"7"' }`. */
  public responseHeaders: Record<string, string> = {};
  /**
   * Makes the next request fail the way every real client does: a non-2xx answer is not returned, it is
   * thrown as an error carrying the status. Set to a status to arm it, `undefined` to respond normally.
   */
  public failWithStatus?: number;

  public readonly concurrency = new MockConcurrencyHandler();

  constructor(public isV2: boolean) {}

  request<ResponseModel>(
    url: string,
    method: ODataHttpMethods,
    data: any,
    requestConfig?: MockRequestConfig,
    additionalHeaders?: Record<string, string>,
  ): ODataResponse<ResponseModel> {
    this.lastUrl = url;
    this.lastData = data;
    this.lastOperation = method;
    this.lastRequestConfig = requestConfig || undefined;
    this.additionalHeaders = additionalHeaders;

    // @ts-ignore
    return this.respond();
  }

  post<ResponseModel>(
    url: string,
    data: any,
    requestConfig?: MockRequestConfig,
    additionalHeaders?: Record<string, string>,
  ): ODataResponse<ResponseModel> {
    this.lastUrl = url;
    this.lastData = data;
    this.lastOperation = "POST";
    this.lastRequestConfig = requestConfig || undefined;
    this.additionalHeaders = additionalHeaders;

    // @ts-ignore
    return this.respond();
  }
  get<ResponseModel>(
    url: string,
    requestConfig?: MockRequestConfig,
    additionalHeaders?: Record<string, string>,
  ): ODataResponse<ResponseModel> {
    this.lastUrl = url;
    this.lastData = undefined;
    this.lastOperation = "GET";
    this.lastRequestConfig = requestConfig || undefined;
    this.additionalHeaders = additionalHeaders;

    // @ts-ignore
    return this.respond();
  }
  put<ResponseModel>(
    url: string,
    data: any,
    requestConfig?: MockRequestConfig,
    additionalHeaders?: Record<string, string>,
  ): ODataResponse<ResponseModel> {
    this.lastUrl = url;
    this.lastData = data;
    this.lastOperation = "PUT";
    this.lastRequestConfig = requestConfig || undefined;
    this.additionalHeaders = additionalHeaders;

    // @ts-ignore
    return this.respond();
  }
  patch<ResponseModel>(
    url: string,
    data: any,
    requestConfig?: MockRequestConfig,
    additionalHeaders?: Record<string, string>,
  ): ODataResponse<ResponseModel> {
    this.lastUrl = url;
    this.lastData = data;
    this.lastOperation = "PATCH";
    this.lastRequestConfig = requestConfig || undefined;
    this.additionalHeaders = additionalHeaders;

    // @ts-ignore
    return this.respond();
  }
  delete(
    url: string,
    requestConfig?: MockRequestConfig,
    additionalHeaders?: Record<string, string>,
  ): ODataResponse<void> {
    this.lastUrl = url;
    this.lastData = undefined;
    this.lastOperation = "DELETE";
    this.lastRequestConfig = requestConfig || undefined;
    this.additionalHeaders = additionalHeaders;

    // @ts-ignore
    return this.respond();
  }

  getBlob(
    url: string,
    requestConfig?: MockRequestConfig,
    additionalHeaders?: Record<string, string>,
  ): ODataResponse<Blob> {
    this.lastUrl = url;
    this.lastData = undefined;
    this.lastOperation = "GET";
    this.lastMimeType = undefined;
    this.lastRequestConfig = requestConfig || undefined;
    this.additionalHeaders = additionalHeaders;

    // @ts-ignore
    return this.respond();
  }

  getStream(
    url: string,
    requestConfig?: MockRequestConfig,
    additionalHeaders?: Record<string, string>,
  ): ODataResponse<ReadableStream> {
    this.lastUrl = url;
    this.lastData = undefined;
    this.lastOperation = "GET";
    this.lastMimeType = undefined;
    this.lastRequestConfig = requestConfig || undefined;
    this.additionalHeaders = additionalHeaders;

    // @ts-ignore
    return this.respond();
  }

  createBlob(
    url: string,
    data: Blob,
    mimeType: string,
    requestConfig?: MockRequestConfig,
    additionalHeaders?: Record<string, string>,
  ): ODataResponse<void | Blob> {
    throw new Error("Operation createBlob not supported!");
  }

  createStream(
    url: string,
    data: ReadableStream,
    mimeType: string,
    requestConfig?: MockRequestConfig,
    additionalHeaders?: Record<string, string>,
  ): ODataResponse<void | ReadableStream> {
    throw new Error("Operation createStream not supported!");
  }

  updateStream(
    url: string,
    data: ReadableStream,
    mimeType: string,
    requestConfig?: MockRequestConfig,
    additionalHeaders?: Record<string, string>,
  ): ODataResponse<void | ReadableStream> {
    this.lastUrl = url;
    this.lastData = data;
    this.lastOperation = "PUT";
    this.lastMimeType = mimeType;
    this.lastRequestConfig = requestConfig || undefined;
    this.additionalHeaders = additionalHeaders;

    // @ts-ignore
    return this.respond();
  }

  updateBlob(
    url: string,
    data: Blob,
    mimeType: string,
    requestConfig?: MockRequestConfig,
    additionalHeaders?: Record<string, string>,
  ): ODataResponse<void | Blob> {
    this.lastUrl = url;
    this.lastData = data;
    this.lastOperation = "PUT";
    this.lastMimeType = mimeType;
    this.lastRequestConfig = requestConfig || undefined;
    this.additionalHeaders = additionalHeaders;

    // @ts-ignore
    return this.respond();
  }

  setValueResponse(data: any, name?: string) {
    if (this.isV2) {
      if (!name) {
        throw Error("Parameter [name] must be supplied for V2 responses!");
      }
      this.responseData = { d: { [name]: data } };
    } else {
      this.responseData = { value: data };
    }
  }

  setModelResponse(data: any) {
    this.responseData = this.isV2 ? { d: data } : data;
  }

  /**
   * Binary responses are not wrapped in any way - a blob is handed over as it came.
   */
  setBlobResponse(data: Blob) {
    this.responseData = data;
  }

  /**
   * Same for a stream: whatever the server sent is handed over as it came.
   */
  setStreamResponse(data: ReadableStream) {
    this.responseData = data;
  }

  setCollectionResponse(data: any) {
    this.responseData = this.isV2 ? { d: { results: data } } : { value: data };
  }

  private respond() {
    this.requestCount++;
    if (this.failWithStatus !== undefined) {
      const error = new Error(`Mock failure with status ${this.failWithStatus}`) as Error & { status: number };
      error.status = this.failWithStatus;
      return Promise.reject(error);
    }
    const result = Promise.resolve({
      status: this.responseStatus,
      statusText: "OK",
      headers: this.responseHeaders,
      data: this.responseData ?? null,
    });

    this.responseData = null;
    return result;
  }
}
