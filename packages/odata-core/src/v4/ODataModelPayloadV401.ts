/*
 * All control information is modelled with the short form here, e.g. "@type" instead of "@odata.type",
 * which payloads of OData 4.01 and greater should use. The prefixed form of 4.0 lives in ODataModelPayloadV4.
 *
 * The control information is factored out into its own type, so that FlexibleModelPayloadV4 can recombine it.
 *
 * See https://docs.oasis-open.org/odata/odata-json-format/v4.01/odata-json-format-v4.01.html#sec_ControlInformation
 */

/**
 * Control information of a request payload for an EntityType or ComplexType.
 */
export interface ModelPayloadControlInfoV401 {
  /**
   * The type control information MUST appear in requests,
   * if the type cannot be heuristically determined (see link for heuristics) and one of the following is true:
   * - The type is derived from the type specified for the (collection of) entities or (collection of) complex type instances
   * - The type is for a property whose type is not declared in $metadata.
   *
   * For built-in primitive types the value is the unqualified name of the primitive type.
   *
   * Built-in primitive type values SHOULD be represented without the hash symbol (#), but consumers of 4.01 or
   * greater payloads MUST support values with or without it.
   *
   * For all other types, the URI may be absolute or relative to the type of the containing object.
   * The root type may be absolute or relative to the root context URL.
   *
   * See https://docs.oasis-open.org/odata/odata-json-format/v4.01/odata-json-format-v4.01.html#sec_ControlInformationtypeodatatype
   */
  "@type"?: string;

  /**
   * The context control information MUST also be included in requests for entities
   * whose entity set cannot be determined from the context URL of the collection.
   *
   * Request payloads MAY include a context URL as a base URL for relative URLs in the request payload.
   *
   * See: https://docs.oasis-open.org/odata/odata-json-format/v4.01/odata-json-format-v4.01.html#sec_ControlInformationcontextodatacontex
   */
  "@context"?: string;
}

/**
 * Request payload for an EntityType or ComplexType.
 *
 * The model is sent directly, control information is merged into it.
 */
export type ODataModelPayloadV401<T> = T & ModelPayloadControlInfoV401;
