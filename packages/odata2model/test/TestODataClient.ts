import { ODataClient } from "@odata2ts/odata-client-api";
import axios, { AxiosPromise, AxiosRequestConfig } from "axios";

export class TestODataClient implements ODataClient<AxiosRequestConfig> {
  post<T, ResponseModel>(url: string, data: T, requestConfig?: AxiosRequestConfig): AxiosPromise<ResponseModel> {
    return axios.post(url, data);
  }
  get<T>(url: string, requestConfig?: AxiosRequestConfig): AxiosPromise<T> {
    return axios.get(url);
  }
  put<T>(url: string, data: T, requestConfig?: AxiosRequestConfig): AxiosPromise<void> {
    return axios.put(url, data);
  }
  patch<T>(url: string, data: Partial<T>, requestConfig?: AxiosRequestConfig): AxiosPromise<void> {
    return axios.patch(url);
  }
  delete(url: string, requestConfig?: AxiosRequestConfig): AxiosPromise<void> {
    return axios.delete(url);
  }
}
