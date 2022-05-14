import { ODataResponse } from "./ODataResponseModel";

export interface ODataClient<RequestConfig = any> {
  /**
   * Create a model or collection entry.
   *
   * @param url
   * @param data
   * @param requestConfig
   */
  post<T, ResponseModel>(url: string, data: T, requestConfig?: RequestConfig): ODataResponse<ResponseModel>;

  get<T>(url: string, requestConfig?: RequestConfig): ODataResponse<T>;

  /**
   * Replace a model.
   *
   * @param url
   * @param data
   * @param requestConfig
   */
  put<T>(url: string, data: T, requestConfig?: RequestConfig): ODataResponse<void>;

  /**
   * Partially update a model.
   *
   * @param url
   * @param data
   * @param requestConfig
   */
  patch<T>(url: string, data: Partial<T>, requestConfig?: RequestConfig): ODataResponse<void>;

  /**
   * OData V2 only feature.
   * Historically, PATCH method was not part of the official HTTP spec, when V1 & V2 were specified;
   * but use of PATCH was already envisioned {@link https://www.odata.org/documentation/odata-version-2-0/operations/}.
   * V3 and all following versions, specify use of PATCH method.
   *
   * If implemented, this method wil be used instead of patch to partially update models.
   * Use case: You want to reuse this client and one server can only handle MERGE,
   * but not PATCH http requests.
   *
   * @param url
   * @param data
   * @param requestConfig
   */
  merge?<T>(url: string, data: Partial<T>, requestConfig?: RequestConfig): ODataResponse<void>;

  /**
   * Delete a model or collection.
   *
   * @param url
   * @param requestConfig
   */
  delete(url: string, requestConfig?: RequestConfig): ODataResponse<void>;

  // TODO --- OData Feature Matrix --- TODO
  // Security: Basic Auth
  // Optimistic Locking: ETag (Header)
  // Header Infos:
  //   - Location: specifies edit or read url; Create (Media) Entity or Async Request with 202
  //   - OData-EntityId: id of created / upserted entity; Create or Update with 204
  //   - OData-Error
  //   - Preference-Applied
  //   - Vary
  // Special Ops: Batch, Async Requests

  // TODO --- Standard Features --- TODO
  // additional headers: eg. CSRF token
}
