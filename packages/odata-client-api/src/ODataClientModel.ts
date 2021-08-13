import { ODataResponse } from "./ODataResponseModel";

export interface ODataClient<RequestConfig = any> {
  post<T, ResponseModel>(url: string, data: T, requestConfig?: RequestConfig): ODataResponse<ResponseModel>;
  get<T>(url: string, requestConfig?: RequestConfig): ODataResponse<T>;
  put<T>(url: string, data: T, requestConfig?: RequestConfig): ODataResponse<void>;
  patch<T>(url: string, data: Partial<T>, requestConfig?: RequestConfig): ODataResponse<void>;
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
