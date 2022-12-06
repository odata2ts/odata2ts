/**
 * This model serves as contract between odata2ts and any OData client implementation,
 * e.g. {@link @odata2ts/AxiosODataClient}.
 *
 * The OData client must return the following response model.
 */
export interface HttpResponseModel<T> {
  /** status code, e.g. 200 or 404 */
  status: number;
  /** status text, e.g. 200 = "OK" or 404 = "Not Found" */
  statusText: string;
  /** response headers as key value pairs */
  headers: { [key: string]: string };
  // config?: any;
  /** response data */
  data: T;
}

/**
 * Wrapping response instance, containing status code info, headers
 * and the response body.
 */
export type ODataResponse<T> = Promise<HttpResponseModel<T>>;
