export interface RequestError extends Error {
  /**
   * error code, e.g. 'ECONNABORTED'
   */
  code?: string; // e.g. ECONNABORTED
  /**
   * numerical HTTP status code of the XMLHttpRequest's response, e.g. 500
   */
  status: number;
  /**
   * Response data
   */
  data?: unknown;
}
