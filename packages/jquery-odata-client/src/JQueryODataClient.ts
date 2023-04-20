/// <reference path="../../../node_modules/@types/jquery/misc.d.ts" />
/// <reference path="../../../node_modules/@types/jquery/JQueryStatic.d.ts" />

import { HttpResponseModel, ODataClient } from "@odata2ts/odata-client-api";

import { AjaxRequestConfig, getDefaultConfig, mergeAjaxConfig } from "./AjaxConfig";
import { JQueryODataClientError } from "./JQueryODataClientError";

export type ErrorMessageRetriever = (errorResponse: any) => string | undefined;

export interface ClientOptions {
  // useCsrfProtection?: boolean;
  // csrfTokenFetchUrl?: string;
}

export const getV2OrV4ErrorMessage: ErrorMessageRetriever = (errorResponse: any): string | undefined => {
  const eMsg = errorResponse?.error?.message;
  return typeof eMsg?.value === "string" ? eMsg.value : eMsg;
};

export class JQueryODataClient implements ODataClient<AjaxRequestConfig> {
  private client: JQueryStatic;
  private config: JQuery.AjaxSettings;
  private getErrorMessage: ErrorMessageRetriever = getV2OrV4ErrorMessage;

  constructor(jquery: JQueryStatic, config?: AjaxRequestConfig, private clientOptions?: ClientOptions) {
    this.client = jquery;
    this.config = getDefaultConfig(config);
  }

  public setErrorMessageRetriever(getErrorMsg: ErrorMessageRetriever) {
    this.getErrorMessage = getErrorMsg;
  }

  public sendRequest<ResponseType>(
    config: JQuery.AjaxSettings,
    requestConfig?: AjaxRequestConfig
  ): Promise<HttpResponseModel<ResponseType>> {
    const mergedConfig = mergeAjaxConfig(mergeAjaxConfig(this.config, requestConfig), config);
    return new Promise((resolve, reject) => {
      this.client.ajax({
        ...mergedConfig,
        success: (response: any, textStatus: string, jqXHR: JQuery.jqXHR) => {
          resolve({
            status: jqXHR.status,
            statusText: jqXHR.statusText,
            headers: jqXHR.getAllResponseHeaders(),
            data: response,
          });
        },
        error: (jqXHR: JQuery.jqXHR, textStatus: string, thrownError: string) => {
          const message = this.getErrorMessage(jqXHR.responseJSON);
          if (message) {
            reject(
              new JQueryODataClientError("Server responded with error: " + message, jqXHR.status, { cause: jqXHR })
            );
          } else {
            reject(new JQueryODataClientError(textStatus + " " + thrownError, jqXHR.status, { cause: jqXHR }));
          }
        },
      });

      // return this.handleError();
    });
  }

  public post<ResponseModel>(
    url: string,
    data: any,
    requestConfig?: AjaxRequestConfig
  ): Promise<HttpResponseModel<ResponseModel>> {
    return this.sendRequest<ResponseModel>({ url, data, method: "POST" }, requestConfig);
  }
  public get<ResponseModel>(url: string, requestConfig?: AjaxRequestConfig): Promise<HttpResponseModel<ResponseModel>> {
    return this.sendRequest<ResponseModel>({ url, method: "GET" }, requestConfig);
  }
  public put<ResponseModel>(
    url: string,
    data: any,
    requestConfig?: AjaxRequestConfig
  ): Promise<HttpResponseModel<ResponseModel>> {
    return this.sendRequest<ResponseModel>({ url, data, method: "PUT" }, requestConfig);
  }
  public patch<ResponseModel>(
    url: string,
    data: any,
    requestConfig?: AjaxRequestConfig
  ): Promise<HttpResponseModel<ResponseModel>> {
    return this.sendRequest<ResponseModel>({ url, data, method: "PATCH" }, requestConfig);
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
    return this.sendRequest<ResponseModel>({ url, data, method: "POST" }, config);
  }
  public delete(url: string, requestConfig?: AjaxRequestConfig): Promise<HttpResponseModel<void>> {
    return this.sendRequest<void>({ url, method: "DELETE" }, requestConfig);
  }
}
