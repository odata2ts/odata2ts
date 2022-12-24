import { HttpResponseModel, ODataClient } from "@odata2ts/odata-client-api";
import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from "axios";

import { RequestError } from "./ODataRequestErrorModel";

export type ErrorMessageRetriever<ResponseType = any> = (error: AxiosError<ResponseType>) => string | null | undefined;

export interface ClientOptions {
  useCsrfProtection?: boolean;
  csrfTokenFetchUrl?: string;
}

export const getV2OrV4ErrorMessage: ErrorMessageRetriever = (error: AxiosError<any>): string | undefined => {
  const eMsg = error?.response?.data?.error?.message;
  return typeof eMsg?.value === "string" ? eMsg.value : eMsg;
};

const DEFAULT_CONFIG: AxiosRequestConfig = {
  headers: { Accept: "application/json", "Content-Type": "application/json" },
};

export class AxiosODataClient implements ODataClient<AxiosRequestConfig> {
  private readonly client: AxiosInstance;
  private csrfToken: string | undefined;
  private getErrorMessage: ErrorMessageRetriever = getV2OrV4ErrorMessage;

  constructor(config?: AxiosRequestConfig, private clientOptions?: ClientOptions) {
    const { headers, ...passThrough } = config || {};
    this.client = axios.create({
      ...passThrough,
      headers: {
        ...DEFAULT_CONFIG.headers,
        ...headers,
      },
    });

    if (clientOptions?.useCsrfProtection) {
      this.setupSecurityTokenInterceptors();
    }
  }

  public setErrorMessageRetriever<T>(getErrorMsg: ErrorMessageRetriever<T>) {
    this.getErrorMessage = getErrorMsg;
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

  private async fetchSecurityToken(): Promise<string | undefined> {
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

  private handleError<T>(instance: Promise<HttpResponseModel<T>>): Promise<HttpResponseModel<T>> {
    return instance.catch((err) => {
      return Promise.reject(this.convertError(err));
    });
  }

  private convertError(error: Error): Error | RequestError {
    if ((error as AxiosError).isAxiosError) {
      const axiosError: AxiosError = error as AxiosError;

      const status = axiosError.response != null ? axiosError.response.status : 0;
      const message = this.getErrorMessage(axiosError);

      return Object.assign(new Error(), {
        isRequestError: true,
        stack: axiosError.stack,
        message,
        canceled: axios.isCancel(axiosError),
        code: axiosError.code,
        status,
        data: axiosError.response ? axiosError.response.data : undefined,
      });
    }
    return error;
  }

  public async refreshCsrfToken() {
    this.csrfToken = await this.fetchSecurityToken();
  }

  public getInstance() {
    return this.client;
  }

  public post<ResponseModel>(
    url: string,
    data: any,
    requestConfig?: AxiosRequestConfig
  ): Promise<HttpResponseModel<ResponseModel>> {
    return this.handleError(this.client.post(url, data, requestConfig));
  }
  public get<ResponseModel>(
    url: string,
    requestConfig?: AxiosRequestConfig
  ): Promise<HttpResponseModel<ResponseModel>> {
    return this.handleError(this.client.get(url, requestConfig));
  }
  public put<ResponseModel>(
    url: string,
    data: any,
    requestConfig?: AxiosRequestConfig
  ): Promise<HttpResponseModel<ResponseModel>> {
    return this.handleError(this.client.put(url, data, requestConfig));
  }
  public patch<ResponseModel>(
    url: string,
    data: any,
    requestConfig?: AxiosRequestConfig
  ): Promise<HttpResponseModel<ResponseModel>> {
    return this.handleError(this.client.patch(url, data, requestConfig));
  }
  public merge<ResponseModel>(
    url: string,
    data: any,
    requestConfig?: AxiosRequestConfig
  ): Promise<HttpResponseModel<ResponseModel>> {
    const { headers, ...passThrough } = requestConfig || {};
    const mergedConfig: AxiosRequestConfig = {
      headers: {
        "X-Http-Method": "MERGE",
        ...headers,
      },
      ...passThrough,
    };
    return this.handleError(this.client.post(url, data, mergedConfig));
  }
  public delete(url: string, requestConfig?: AxiosRequestConfig): Promise<HttpResponseModel<void>> {
    return this.handleError(this.client.delete(url, requestConfig));
  }
}
