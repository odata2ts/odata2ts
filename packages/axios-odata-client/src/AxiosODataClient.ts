import { ODataClient } from "@odata2ts/odata-client-api";
import axios, { AxiosError, AxiosInstance, AxiosPromise, AxiosRequestConfig, AxiosResponse } from "axios";

import { RequestError } from "./ODataRequestErrorModel";

export type ErrorMessageRetriever = (error: AxiosError) => string | null | undefined;

export interface ClientOptions {
  useCsrfProtection?: boolean;
  csrfTokenFetchUrl?: string;
}

export class AxiosODataClient implements ODataClient<AxiosRequestConfig> {
  private readonly client: AxiosInstance;
  private csrfToken: string | undefined;

  constructor(
    private getErrorMessage: ErrorMessageRetriever,
    config?: AxiosRequestConfig,
    private clientOptions?: ClientOptions
  ) {
    this.client = axios.create(config);

    if (clientOptions?.useCsrfProtection) {
      this.setupSecurityTokenInterceptors();
    }
  }

  private setupSecurityTokenInterceptors() {
    this.client.interceptors.request.use(
      async (config: AxiosRequestConfig & { "skip-csrf-token-handling"?: boolean }) => {
        if (config["skip-csrf-token-handling"]) {
          return config;
        }
        if (config.method != null && ["POST", "PUT", "DELETE"].includes(config.method.toUpperCase())) {
          await this.setupSecurityToken();
          if (config.headers == null) {
            config.headers = {};
          }

          if (this.csrfToken != null) {
            config.headers["x-csrf-token"] = this.csrfToken;
          }
        }
        return config;
      }
    );

    this.client.interceptors.response.use(undefined, (error: Error | AxiosError) => {
      if (
        axios.isAxiosError(error) &&
        error.config != null &&
        error.response?.status === 403 &&
        error.response?.headers?.["x-csrf-token"] === "Required"
      ) {
        // csrf token expired, let's reset it and refetch
        this.csrfToken = undefined;

        return this.client.request(error.config);
      }
      return Promise.reject(error);
    });
  }

  private async setupSecurityToken() {
    if (this.csrfToken == null) {
      this.csrfToken = await this.fetchSecurityToken();
    }
  }

  private async fetchSecurityToken(): Promise<string> {
    const fetchUrl = this.clientOptions?.csrfTokenFetchUrl ?? "/";
    const response = await this.client.get(fetchUrl, {
      headers: {
        "x-csrf-token": "Fetch",
      },
      // @ts-ignore
      "skip-csrf-token-handling": true,
    });

    return response.headers["x-csrf-token"];
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

  public async refreshCsrfToken() {
    this.csrfToken = await this.fetchSecurityToken();
  }

  public getInstance() {
    return this.client;
  }

  public post<T, ResponseModel>(url: string, data: T, requestConfig?: AxiosRequestConfig): AxiosPromise<ResponseModel> {
    return this.handleError(this.client.post(url, data, requestConfig));
  }
  public get<T>(url: string, requestConfig?: AxiosRequestConfig): AxiosPromise<T> {
    return this.handleError(this.client.get(url, requestConfig));
  }
  public put<T>(url: string, data: T, requestConfig?: AxiosRequestConfig): AxiosPromise<void> {
    return this.handleError(this.client.put(url, data, requestConfig));
  }
  public patch<T>(url: string, data: Partial<T>, requestConfig?: AxiosRequestConfig): AxiosPromise<void> {
    return this.handleError(this.client.patch(url, data, requestConfig));
  }
  public delete(url: string, requestConfig?: AxiosRequestConfig): AxiosPromise<void> {
    return this.handleError(this.client.delete(url, requestConfig));
  }
}
