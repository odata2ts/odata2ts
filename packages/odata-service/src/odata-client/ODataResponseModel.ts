/**
 * Response to a collection query.
 */
export interface ODataCollectionResponse<T> {
  "@odata.context": string;
  "@odata.count"?: number;
  value: Array<T>;
}

/**
 * Response to a value query on a property.
 */
export interface ODataValueResponse<T> {
  "@odata.context": string;
  value: T;
}

/**
 * Response to query for an EntityType or ComplexType
 *
 * Result object is directly returned.
 * Additional context attribute is merged into result object.
 */
export type ODataResponse<T> = T & {
  "@odata.context": string;
};

/**
 * Response to query for a raw value, by appending '/$value'
 * to the path of a property.
 */
export type ODataRawResponse = string;
