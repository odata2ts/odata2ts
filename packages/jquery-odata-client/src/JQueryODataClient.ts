import { HttpResponseModel, ODataClient } from "@odata2ts/odata-client-api";
import $ from "jquery";

import { AjaxRequestConfig, getDefaultConfig, mergeAjaxConfig } from "./AjaxConfig";
import { RequestError } from "./ODataRequestErrorModel";

import jqXHR = JQuery.jqXHR;

export type ErrorMessageRetriever = (errorResponse: any) => string | undefined;

type JQueryInstance = JQuery<any> & Pick<JQueryStatic, "ajax">;

export interface ClientOptions {
  // useCsrfProtection?: boolean;
  // csrfTokenFetchUrl?: string;
}

export const getV2OrV4ErrorMessage: ErrorMessageRetriever = (errorResponse: any): string | undefined => {
  const eMsg = errorResponse?.error?.message;
  return typeof eMsg?.value === "string" ? eMsg.value : eMsg;
};

export class JQueryODataClient implements ODataClient<AjaxRequestConfig> {
  private client: JQueryInstance;
  private config: JQuery.AjaxSettings;
  private getErrorMessage: ErrorMessageRetriever = getV2OrV4ErrorMessage;

  constructor(jquery: JQuery<any>, config?: AjaxRequestConfig, private clientOptions?: ClientOptions) {
    this.client = jquery as JQueryInstance;
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
        success: (response: any, textStatus: string, jqXHR: jqXHR) => {
          resolve({
            status: jqXHR.status,
            statusText: jqXHR.statusText,
            headers: jqXHR.getAllResponseHeaders(),
            data: response,
          });
        },
        error: (jqXHR: jqXHR, textStatus: string, thrownError: string) => {
          const message = this.getErrorMessage(jqXHR.responseJSON);

          reject(
            Object.assign(new Error(), {
              status: jqXHR.status || 0,
              code: jqXHR.statusText,
              data: jqXHR.responseJSON,
              message,
            } as RequestError)
          );
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
