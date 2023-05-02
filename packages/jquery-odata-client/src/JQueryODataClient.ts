/// <reference path="../../../node_modules/@types/jquery/misc.d.ts" />
/// <reference path="../../../node_modules/@types/jquery/JQueryStatic.d.ts" />

import { HttpResponseModel, ODataClient } from "@odata2ts/odata-client-api";

import { AjaxRequestConfig, getDefaultConfig, mergeAjaxConfig } from "./AjaxConfig";
import { JQueryODataClientError } from "./JQueryODataClientError";

export type ErrorMessageRetriever = (errorResponse: any) => string | undefined;

export interface ClientOptions {
  useCsrfProtection?: boolean;
  csrfTokenFetchUrl?: string;
}

export const getV2OrV4ErrorMessage: ErrorMessageRetriever = (errorResponse: any): string | undefined => {
  const eMsg = errorResponse?.error?.message;
  return typeof eMsg?.value === "string" ? eMsg.value : eMsg;
};

export class JQueryODataClient implements ODataClient<AjaxRequestConfig> {
  private readonly client: JQueryStatic;
  private readonly config: JQuery.AjaxSettings;
  private csrfToken: string | undefined;
  private getErrorMessage: ErrorMessageRetriever = getV2OrV4ErrorMessage;

  constructor(jquery: JQueryStatic, config?: AjaxRequestConfig, private clientOptions?: ClientOptions) {
    this.client = jquery;
    this.config = getDefaultConfig(config);
  }

  public setErrorMessageRetriever(getErrorMsg: ErrorMessageRetriever) {
    this.getErrorMessage = getErrorMsg;
  }

  private async setupSecurityToken() {
    if (!this.csrfToken) {
      this.csrfToken = await this.fetchSecurityToken();
    }
    return this.csrfToken;
  }

  private async fetchSecurityToken(): Promise<string | undefined> {
    const fetchUrl = this.clientOptions?.csrfTokenFetchUrl ?? "/";
    const response = await this.get(fetchUrl, { headers: { "x-csrf-token": "Fetch" } });

    return response.headers["x-csrf-token"];
  }

  private async sendRequest<ResponseType>(
    config: JQuery.AjaxSettings,
    requestConfig?: AjaxRequestConfig
  ): Promise<HttpResponseModel<ResponseType>> {
    const mergedConfig = mergeAjaxConfig(mergeAjaxConfig(this.config, requestConfig), config);

    // setup automatic CSRF token handling
    if (
      this.clientOptions?.useCsrfProtection &&
      mergedConfig.method &&
      ["POST", "PUT", "PATCH", "DELETE"].includes(mergedConfig.method.toUpperCase())
    ) {
      const csrfToken = await this.setupSecurityToken();
      if (!mergedConfig.headers) {
        mergedConfig.headers = {};
      }
      if (this.csrfToken) {
        mergedConfig.headers["x-csrf-token"] = csrfToken;
      }
    }

    // the actual request
    return new Promise((resolve, reject) => {
      this.client.ajax({
        ...mergedConfig,
        success: (response: any, textStatus: string, jqXHR: JQuery.jqXHR) => {
          // Convert the header string into an array of individual headers
          const headers = jqXHR
            .getAllResponseHeaders()
            .trim()
            .split(/[\r\n]+/)
            .reduce<Record<string, string>>((collector, line) => {
              const parts = line.split(": ");
              const header = parts.shift();
              const value = parts.join(": ");

              if (header) {
                collector[header.toLowerCase()] = value;
              }
              return collector;
            }, {});

          resolve({
            status: jqXHR.status,
            statusText: jqXHR.statusText,
            headers,
            data: response,
          });
        },
        error: (jqXHR: JQuery.jqXHR, textStatus: string, thrownError: string) => {
          // automatic CSRF token handling
          if (
            this.clientOptions?.useCsrfProtection &&
            jqXHR.status === 403 &&
            jqXHR.getResponseHeader("x-csrf-token") === "Required"
          ) {
            // csrf token expired, let's reset it and perform the original request again
            this.csrfToken = undefined;
            this.sendRequest<ResponseType>(config, requestConfig).then(resolve).catch(reject);
          }
          // actual error handling
          else {
            const message = this.getErrorMessage(jqXHR.responseJSON);
            if (message) {
              reject(
                new JQueryODataClientError("Server responded with error: " + message, jqXHR.status, { cause: jqXHR })
              );
            } else {
              reject(new JQueryODataClientError(textStatus + " " + thrownError, jqXHR.status, { cause: jqXHR }));
            }
          }
        },
      });
    });
  }

  private prepareData(data: any): string {
    return JSON.stringify(data);
  }

  public post<ResponseModel>(
    url: string,
    data: any,
    requestConfig?: AjaxRequestConfig
  ): Promise<HttpResponseModel<ResponseModel>> {
    return this.sendRequest<ResponseModel>({ url, data: this.prepareData(data), method: "POST" }, requestConfig);
  }
  public get<ResponseModel>(url: string, requestConfig?: AjaxRequestConfig): Promise<HttpResponseModel<ResponseModel>> {
    return this.sendRequest<ResponseModel>({ url, method: "GET" }, requestConfig);
  }
  public put<ResponseModel>(
    url: string,
    data: any,
    requestConfig?: AjaxRequestConfig
  ): Promise<HttpResponseModel<ResponseModel>> {
    return this.sendRequest<ResponseModel>({ url, data: this.prepareData(data), method: "PUT" }, requestConfig);
  }
  public patch<ResponseModel>(
    url: string,
    data: any,
    requestConfig?: AjaxRequestConfig
  ): Promise<HttpResponseModel<ResponseModel>> {
    return this.sendRequest<ResponseModel>({ url, data: this.prepareData(data), method: "PATCH" }, requestConfig);
  }
  public merge<ResponseModel>(
    url: string,
    data: any,
    requestConfig?: AjaxRequestConfig
  ): Promise<HttpResponseModel<ResponseModel>> {
    const config = mergeAjaxConfig(requestConfig, {
      headers: {
        "X-Http-Method": "MERGE",
      },
    });
    return this.sendRequest<ResponseModel>({ url, data: this.prepareData(data), method: "POST" }, config);
  }
  public delete(url: string, requestConfig?: AjaxRequestConfig): Promise<HttpResponseModel<void>> {
    return this.sendRequest<void>({ url, method: "DELETE" }, requestConfig);
  }
}
