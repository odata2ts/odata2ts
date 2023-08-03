import { ODataHttpClient, ODataResponse } from "@odata2ts/http-client-api";

export interface MockRequestConfig {
  test: string;
}

/**
 * Mock for an ODataHttpClient.
 * Use <code>client.lastUrl</code> or <code>client.lastData</code> to acces passed data.
 */
export class MockClient implements ODataHttpClient<MockRequestConfig> {
  public lastUrl?: string;
  public lastData?: any;
  public lastOperation?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  public lastRequestConfig?: MockRequestConfig;
  public additionalHeaders?: Record<string, string>;

  public responseData?: any;

  constructor(public isV2: boolean) {}

  post<ResponseModel>(
    url: string,
    data: any,
    requestConfig?: MockRequestConfig,
    additionalHeaders?: Record<string, string>
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
    additionalHeaders?: Record<string, string>
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
    additionalHeaders?: Record<string, string>
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
    additionalHeaders?: Record<string, string>
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
    additionalHeaders?: Record<string, string>
  ): ODataResponse<void> {
    this.lastUrl = url;
    this.lastData = undefined;
    this.lastOperation = "DELETE";
    this.lastRequestConfig = requestConfig || undefined;
    this.additionalHeaders = additionalHeaders;

    // @ts-ignore
    return this.respond();
  }

  setModelResponse(data: any) {
    this.responseData = this.isV2 ? { d: data } : data;
  }

  setCollectionResponse(data: any) {
    this.responseData = this.isV2 ? { d: { results: data } } : { value: data };
  }

  private respond() {
    const result = Promise.resolve({
      status: 200,
      statusText: "OK",
      headers: {},
      data: this.responseData ?? null,
    });

    this.responseData = null;
    return result;
  }
}
