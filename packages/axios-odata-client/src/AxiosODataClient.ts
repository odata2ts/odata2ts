import { ODataClient } from "@odata2ts/odata-client-api";
import axios, { AxiosError, AxiosInstance, AxiosPromise, AxiosRequestConfig, AxiosResponse } from "axios";

import { RequestError } from "./ODataRequestErrorModel";

export type ErrorMessageRetriever = (error: AxiosError) => string | null | undefined;

export class AxiosODataClient implements ODataClient<AxiosRequestConfig> {
  private client: AxiosInstance;

  constructor(private getErrorMessage: ErrorMessageRetriever, config?: AxiosRequestConfig) {
    this.client = axios.create(config);
  }

  private handleError<T>(instance: AxiosPromise): Promise<AxiosResponse<T>> {
    return instance.catch((err) => {
      return Promise.reject(this.convertError(err));
    });
  }

  private convertError(error: Error): Error | RequestError {
    if ((error as AxiosError).isAxiosError) {
      const axiosError: AxiosError = error as AxiosError;

      const status = axiosError.response != null ? axiosError.response.status : 0;
      const message = this.getErrorMessage(axiosError);

      const serverError: RequestError = Object.assign(new Error(), {
        isRequestError: true,
        stack: axiosError.stack,
        message: message,
        canceled: axios.isCancel(axiosError),
        code: axiosError.code,
        status: status,
        data: axiosError.response != null ? axiosError.response.data : undefined,
      });
      return serverError;
    }
    return error;
  }

  post<T, ResponseModel>(url: string, data: T, requestConfig?: AxiosRequestConfig): AxiosPromise<ResponseModel> {
    return this.handleError(this.client.post(url, data, requestConfig));
  }
  get<T>(url: string, requestConfig?: AxiosRequestConfig): AxiosPromise<T> {
    return this.handleError(this.client.get(url, requestConfig));
  }
  put<T>(url: string, data: T, requestConfig?: AxiosRequestConfig): AxiosPromise<void> {
    return this.handleError(this.client.put(url, data, requestConfig));
  }
  patch<T>(url: string, data: Partial<T>, requestConfig?: AxiosRequestConfig): AxiosPromise<void> {
    return this.handleError(this.client.patch(url, data, requestConfig));
  }
  delete(url: string, requestConfig?: AxiosRequestConfig): AxiosPromise<void> {
    return this.handleError(this.client.delete(url, requestConfig));
  }
}
