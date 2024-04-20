/**
 * Response to query for an EntityType or ComplexType
 *
 * Result object is directly returned.
 * Additional context attribute is merged into result object.
 */
export type ODataModelPayloadV4<T> = T & {
  /**
   * The type control information MUST appear in requests,
   * if the type cannot be heuristically determined (see link for heuristics) and one of the following is true:
   * - The type is derived from the type specified for the (collection of) entities or (collection of) complex type instances
   * - The type is for a property whose type is not declared in $metadata.
   *
   * For built-in primitive types the value is the unqualified name of the primitive type.
   *
   * For payloads described by an OData-Version header with a value of 4.0,
   * this name MUST be prefixed with the hash symbol (#);
   * for non-OData 4.0 payloads, built-in primitive type values SHOULD be represented without the hash symbol,
   * but consumers of 4.01 or greater payloads MUST support values with or without the hash symbol.
   *
   * For all other types, the URI may be absolute or relative to the type of the containing object.
   * The root type may be absolute or relative to the root context URL.
   *
   * See https://docs.oasis-open.org/odata/odata-json-format/v4.01/odata-json-format-v4.01.html#sec_ControlInformationtypeodatatype
   */
  "@odata.type"?: string;

  /**
   * The context control information MUST also be included in requests for entities
   * whose entity set cannot be determined from the context URL of the collection.
   *
   * Request payloads MAY include a context URL as a base URL for relative URLs in the request payload.
   *
   * See: https://docs.oasis-open.org/odata/odata-json-format/v4.01/odata-json-format-v4.01.html#sec_ControlInformationcontextodatacontex
   */
  "@odata.context"?: string;
};
