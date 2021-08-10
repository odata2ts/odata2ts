export interface ODataClient {
  get<T>(url: string): Promise<T>;
  put<T>(url: string, data: T): Promise<any>;
  patch<T>(url: string, data: Partial<T>): Promise<void>;
  delete<T>(url: string): Promise<void>;
}
