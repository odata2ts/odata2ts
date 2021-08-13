import { ODataClient, ODataResponse } from "@odata2ts/odata-client-api";

export interface MockRequestConfig {
  test: string;
}

/**
 * Mock for an ODataClient.
 * Use <code>client.lastUrl</code> or <code>client.lastData</code> to acces passed data.
 */
export class MockODataClient implements ODataClient<MockRequestConfig> {
  public lastUrl: string | undefined = undefined;
  public lastData: any | undefined = undefined;

  post<T, ResponseModel>(url: string, data: T, requestConfig?: MockRequestConfig): ODataResponse<ResponseModel> {
    this.lastUrl = url;
    this.lastData = data;
    // @ts-ignore
    return this.respond();
  }
  get<T>(url: string, requestConfig?: MockRequestConfig): ODataResponse<T> {
    this.lastUrl = url;
    // @ts-ignore
    return this.respond();
  }
  put<T>(url: string, data: T, requestConfig?: MockRequestConfig): ODataResponse<void> {
    this.lastUrl = url;
    this.lastData = data;
    // @ts-ignore
    return this.respond();
  }
  patch<T>(url: string, data: Partial<T>, requestConfig?: MockRequestConfig): ODataResponse<void> {
    this.lastUrl = url;
    this.lastData = data;
    // @ts-ignore
    return this.respond();
  }
  delete(url: string, requestConfig?: MockRequestConfig): ODataResponse<void> {
    this.lastUrl = url;
    // @ts-ignore
    return this.respond();
  }

  private respond() {
    const genericResponse = {
      status: 200,
      statusText: "OK",
      headers: {},
      data: null,
    };
    return Promise.resolve(genericResponse);
  }
}
