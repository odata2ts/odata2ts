import { ODataHttpClient, ODataResponse } from "@odata2ts/http-client-api";

export interface MockRequestConfig {
  test: string;
}

/**
 * Mock for an ODataClient.
 * Use <code>client.lastUrl</code> or <code>client.lastData</code> to acces passed data.
 */
export class MockODataClient implements ODataHttpClient<MockRequestConfig> {
  public lastUrl?: string;
  public lastData?: any;
  public lastOperation?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  public bigNumbersAsString?: boolean;

  post<ResponseModel>(url: string, data: any, requestConfig?: MockRequestConfig): ODataResponse<ResponseModel> {
    this.lastUrl = url;
    this.lastData = data;
    this.lastOperation = "POST";
    // @ts-ignore
    return this.respond();
  }
  get<ResponseModel>(url: string, requestConfig?: MockRequestConfig): ODataResponse<ResponseModel> {
    this.lastUrl = url;
    this.lastData = undefined;
    this.lastOperation = "GET";

    // @ts-ignore
    return this.respond();
  }
  put<ResponseModel>(url: string, data: any, requestConfig?: MockRequestConfig): ODataResponse<ResponseModel> {
    this.lastUrl = url;
    this.lastData = data;
    this.lastOperation = "PUT";

    // @ts-ignore
    return this.respond();
  }
  patch<ResponseModel>(url: string, data: any, requestConfig?: MockRequestConfig): ODataResponse<ResponseModel> {
    this.lastUrl = url;
    this.lastData = data;
    this.lastOperation = "PATCH";

    // @ts-ignore
    return this.respond();
  }
  delete(url: string, requestConfig?: MockRequestConfig): ODataResponse<void> {
    this.lastUrl = url;
    this.lastData = undefined;
    this.lastOperation = "DELETE";

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

  retrieveBigNumbersAsString(enabled: boolean): void {
    this.bigNumbersAsString = enabled;
  }
}
