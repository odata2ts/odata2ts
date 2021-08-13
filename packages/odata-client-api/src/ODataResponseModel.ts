/**
 * Wrapping response instance, containing status code info, headers
 * and the response body.
 */
export type ODataResponse<T> = Promise<{
  /** status code, e.g. 200 or 404 */
  status: number;
  /** status text, e.g. 200 = OK or 404 = Not Found */
  statusText: string;
  headers: { [key: string]: string };
  // config?: any;
  data: T;
}>;

/**
 * Response to a collection query.
 */
export interface ODataCollectionResponse<T> {
  "@odata.context": string;
  "@odata.count"?: number;
  value: Array<T>;
}

/**
 * Response to query for an EntityType or ComplexType
 *
 * Result object is directly returned.
 * Additional context attribute is merged into result object.
 */
export type ODataModelResponse<T> = T & {
  "@odata.context": string;
};

/**
 * Response to a value query on a property.
 */
export interface ODataValueResponse<T> {
  "@odata.context": string;
  value: T;
}

/**
 * Response to query for a raw value, by appending '/$value'
 * to the path of a property.
 */
export type ODataRawResponse<T> = T;
