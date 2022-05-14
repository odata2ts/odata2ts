/**
 * Response to a collection query.
 */
export interface ODataCollectionResponseV4<T> {
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
export type ODataModelResponseV4<T> = T & {
  "@odata.context": string;
};

/**
 * Response to a value query on a property.
 */
export interface ODataValueResponseV4<T> {
  "@odata.context": string;
  value: T;
}

/**
 * Response to query for a raw value, by appending '/$value'
 * to the path of a property.
 */
export type ODataRawResponse<T> = T;
