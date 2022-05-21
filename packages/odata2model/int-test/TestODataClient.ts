import { ODataClient } from "@odata2ts/odata-client-api";
import axios, { AxiosInstance, AxiosPromise, AxiosRequestConfig } from "axios";

export class TestODataClient implements ODataClient<AxiosRequestConfig> {
  axisoInstance: AxiosInstance;

  constructor(private config?: AxiosRequestConfig) {
    this.axisoInstance = axios.create(config);
  }

  post<T, ResponseModel>(url: string, data: T, requestConfig?: AxiosRequestConfig): AxiosPromise<ResponseModel> {
    return this.axisoInstance.post(url, data, requestConfig);
  }
  get<T>(url: string, requestConfig?: AxiosRequestConfig): AxiosPromise<T> {
    return this.axisoInstance.get(url, requestConfig);
  }
  put<T>(url: string, data: T, requestConfig?: AxiosRequestConfig): AxiosPromise<void> {
    return this.axisoInstance.put(url, data, requestConfig);
  }
  patch<T>(url: string, data: Partial<T>, requestConfig?: AxiosRequestConfig): AxiosPromise<void> {
    return this.axisoInstance.patch(url, data, requestConfig);
  }
  merge<T>(url: string, data: Partial<T>, requestConfig?: AxiosRequestConfig): AxiosPromise<void> {
    return this.axisoInstance.request({
      // @ts-ignore: custom old-fashioned V2 merge method
      method: "MERGE",
      url,
      data,
      ...requestConfig,
    });
  }
  delete(url: string, requestConfig?: AxiosRequestConfig): AxiosPromise<void> {
    return this.axisoInstance.delete(url, requestConfig);
  }
}
