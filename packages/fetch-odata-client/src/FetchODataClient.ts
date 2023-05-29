import { HttpResponseModel, ODataClient } from "@odata2ts/odata-client-api";

import { FetchODataClientError } from "./FetchODataClientError";
import { FetchRequestConfig, getDefaultConfig, mergeFetchConfig } from "./FetchRequestConfig";

export type ErrorMessageRetriever = (errorResponse: any) => string | undefined;

export interface ClientOptions {
  useCsrfProtection?: boolean;
  csrfTokenFetchUrl?: string;
}

export const getV2OrV4ErrorMessage: ErrorMessageRetriever = (errorResponse: any): string | undefined => {
  const eMsg = errorResponse?.error?.message;
  return typeof eMsg?.value === "string" ? eMsg.value : eMsg;
};

export const DEFAULT_ERROR_MESSAGE = "No error message!";
const FETCH_FAILURE_MESSAGE = "OData request failed entirely: ";
const JSON_RETRIEVAL_FAILURE_MESSAGE = "Retrieving JSON body from OData response failed: ";
const RESPONSE_FAILURE_MESSAGE = "OData server responded with error: ";

function buildErrorMessage(prefix: string, error: any) {
  const msg = typeof error === "string" ? error : (error as Error)?.message;
  return prefix + (msg || DEFAULT_ERROR_MESSAGE);
}

export class FetchODataClient implements ODataClient<FetchRequestConfig> {
  private readonly config: RequestInit;
  private csrfToken: string | undefined;
  private retrieveErrorMessage: ErrorMessageRetriever = getV2OrV4ErrorMessage;

  constructor(config?: FetchRequestConfig, private clientOptions?: ClientOptions) {
    this.config = getDefaultConfig(config);
    if (clientOptions && clientOptions.useCsrfProtection && !clientOptions.csrfTokenFetchUrl?.trim()) {
      throw new Error(
        "When automatic CSRF token fetching is activated, the URL must be supplied with attribute [csrfTokenFetchUrl]!"
      );
    }
  }

  public setErrorMessageRetriever(getErrorMsg: ErrorMessageRetriever) {
    this.retrieveErrorMessage = getErrorMsg;
  }

  private async setupSecurityToken() {
    if (!this.csrfToken) {
      this.csrfToken = await this.fetchSecurityToken();
    }
    return this.csrfToken;
  }

  private async fetchSecurityToken(): Promise<string | undefined> {
    const fetchUrl = this.clientOptions!.csrfTokenFetchUrl!;
    const response = await this.get(fetchUrl, { headers: { "x-csrf-token": "Fetch" } });

    return response.headers["x-csrf-token"];
  }

  private async sendRequest<ResponseType>(
    url: string,
    config: RequestInit,
    requestConfig?: FetchRequestConfig
  ): Promise<HttpResponseModel<ResponseType>> {
    // noinspection SuspiciousTypeOfGuard
    if (typeof url !== "string") {
      throw new Error("Value for URL must be provided!");
    }

    const mergedConfig = mergeFetchConfig(this.config, requestConfig, config);

    // setup automatic CSRF token handling
    if (
      this.clientOptions?.useCsrfProtection &&
      mergedConfig.method &&
      ["POST", "PUT", "PATCH", "DELETE"].includes(mergedConfig.method.toUpperCase())
    ) {
      const csrfToken = await this.setupSecurityToken();
      if (typeof csrfToken === "string") {
        mergedConfig.headers.set("x-csrf-token", csrfToken);
      }
    }

    // the actual request
    let response: Response;
    try {
      response = await fetch(url, mergedConfig);
    } catch (fetchError) {
      throw new FetchODataClientError(
        buildErrorMessage(FETCH_FAILURE_MESSAGE, fetchError),
        undefined,
        fetchError as Error
      );
    }

    // error response
    if (!response.ok) {
      // automatic CSRF token handling
      if (
        this.clientOptions?.useCsrfProtection &&
        response.status === 403 &&
        response.headers.get("x-csrf-token") === "Required"
      ) {
        // csrf token expired, let's reset it and perform the original request again
        this.csrfToken = undefined;
        return this.sendRequest<ResponseType>(url, config, requestConfig);
      }

      let data = await this.getResponseBody(response, false);
      const errMsg = this.retrieveErrorMessage(data);

      throw new FetchODataClientError(
        buildErrorMessage(RESPONSE_FAILURE_MESSAGE, errMsg),
        response.status,
        new Error(errMsg || DEFAULT_ERROR_MESSAGE),
        response
      );
    }

    const data = await this.getResponseBody(response, true);

    // header
    // Impl Note: No entries prop available, otherwise as one liner Array.from(response.headers.entries)
    const headers: { [key: string]: string } = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });

    return {
      status: response.status,
      statusText: response.statusText,
      headers,
      data,
    };
  }

  private async getResponseBody(response: Response, isFailedJsonFatal: boolean) {
    if (response.status === 204) {
      return undefined;
    }
    try {
      return await response.json();
    } catch (error) {
      if (isFailedJsonFatal) {
        throw new FetchODataClientError(
          buildErrorMessage(JSON_RETRIEVAL_FAILURE_MESSAGE, error),
          response.status,
          error as Error
        );
      }
      return undefined;
    }
  }

  private prepareData(data: any): string {
    return JSON.stringify(data);
  }

  public get<ResponseModel>(
    url: string,
    requestConfig?: FetchRequestConfig
  ): Promise<HttpResponseModel<ResponseModel>> {
    return this.sendRequest<ResponseModel>(url, { method: "GET" }, requestConfig);
  }
  public post<ResponseModel>(
    url: string,
    data: any,
    requestConfig?: FetchRequestConfig
  ): Promise<HttpResponseModel<ResponseModel>> {
    return this.sendRequest<ResponseModel>(url, { body: this.prepareData(data), method: "POST" }, requestConfig);
  }
  public put<ResponseModel>(
    url: string,
    data: any,
    requestConfig?: FetchRequestConfig
  ): Promise<HttpResponseModel<ResponseModel>> {
    return this.sendRequest<ResponseModel>(url, { body: this.prepareData(data), method: "PUT" }, requestConfig);
  }
  public patch<ResponseModel>(
    url: string,
    data: any,
    requestConfig?: FetchRequestConfig
  ): Promise<HttpResponseModel<ResponseModel>> {
    return this.sendRequest<ResponseModel>(url, { body: this.prepareData(data), method: "PATCH" }, requestConfig);
  }
  public merge<ResponseModel>(
    url: string,
    data: any,
    requestConfig?: FetchRequestConfig
  ): Promise<HttpResponseModel<ResponseModel>> {
    return this.sendRequest<ResponseModel>(
      url,
      {
        body: this.prepareData(data),
        method: "POST",
        headers: {
          "X-Http-Method": "MERGE",
        },
      },
      requestConfig
    );
  }
  public delete(url: string, requestConfig?: FetchRequestConfig): Promise<HttpResponseModel<void>> {
    return this.sendRequest<void>(url, { method: "DELETE" }, requestConfig);
  }
}
