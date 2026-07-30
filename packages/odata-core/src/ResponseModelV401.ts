/*
 * All control information is modelled with the short form here, e.g. "@count" instead of "@odata.count",
 * which payloads of OData 4.01 and greater should use. The prefixed form of 4.0 lives in ResponseModelV4.
 *
 * The control information is factored out into its own types, so that FlexibleResponseModelV4 can recombine it.
 *
 * See https://docs.oasis-open.org/odata/odata-json-format/v4.01/odata-json-format-v4.01.html#sec_ControlInformation
 */

/**
 * Control information of a collection response.
 */
export interface CollectionControlInfoV401 {
  /**
   * The context control information returns the context URL for the payload. This URL can be absolute or relative.
   *
   * The context control information is not returned if metadata=none is requested.
   * Otherwise, it MUST be the first property of any JSON response.
   *
   * The context control information MUST also be included in responses for entities
   * whose entity set cannot be determined from the context URL of the collection.
   */
  "@context"?: string;
  /**
   * The type control information MUST appear in responses,
   * if the type cannot be heuristically determined (see link for heuristics) and one of the following is true:
   * - The type is derived from the type specified for the (collection of) entities or (collection of) complex type instances
   *
   * Built-in primitive type values SHOULD be represented without the hash symbol (#), but consumers of 4.01 or
   * greater payloads MUST support values with or without it.
   *
   * See https://docs.oasis-open.org/odata/odata-json-format/v4.01/odata-json-format-v4.01.html#sec_ControlInformationtypeodatatype
   */
  "@type"?: string;
  /**
   * The metadataEtag control information MAY appear in a response in order to specify the entity tag (ETag)
   * that can be used to determine the version of the metadata of the response.
   * If an ETag is returned when requesting the metadata document, then the service SHOULD set the metadataEtag
   * control information to the metadata document's ETag in all responses when using metadata=minimal or metadata=full.
   *
   * If no ETag is returned when requesting the metadata document, then the service SHOULD NOT
   * set the metadataEtag control information in any responses.
   */
  "@metadataEtag"?: string;
  /**
   * The etag control information MAY be applied to an entity or collection in a response.
   * The value of the control information is an entity tag (ETag) which is an opaque string value
   * that can be used in a subsequent request to determine if the value of the entity or collection has changed.
   */
  "@etag"?: string;
  /**
   * The count control information occurs when system query option $count has been used.
   * Its value is an Edm.Int64 value corresponding to the total count of members in the collection represented by the request.
   */
  "@count"?: number;
  /**
   * The nextLink control information indicates that a response is only a subset of the requested collection.
   * It contains a URL that allows retrieving the next subset of the requested collection.
   */
  "@nextLink"?: string;
}

/**
 * Response to a collection query.
 */
export interface ODataCollectionResponseV401<T> extends CollectionControlInfoV401 {
  /**
   * The requested collection value.
   */
  value: Array<T>;
}

/**
 * Control information of a response for an EntityType or ComplexType.
 */
export interface ModelControlInfoV401 {
  /**
   * The context control information returns the context URL for the payload. This URL can be absolute or relative.
   *
   * The context control information is not returned if metadata=none is requested.
   * Otherwise, it MUST be the first property of any JSON response.
   *
   * The context control information MUST also be included in responses for entities
   * whose entity set cannot be determined from the context URL of the collection.
   */
  "@context"?: string;
  /**
   * The type control information MUST appear in responses,
   * if the type cannot be heuristically determined (see link for heuristics) and the following is true:
   * The type is derived from the type specified for the (collection of) entities or (collection of) complex type instances
   *
   * Built-in primitive type values SHOULD be represented without the hash symbol (#), but consumers of 4.01 or
   * greater payloads MUST support values with or without it.
   *
   * See https://docs.oasis-open.org/odata/odata-json-format/v4.01/odata-json-format-v4.01.html#sec_ControlInformationtypeodatatype
   */
  "@type"?: string;
  /**
   * The etag control information MAY be applied to an entity or collection in a response.
   * The value of the control information is an entity tag (ETag) which is an opaque string value
   * that can be used in a subsequent request to determine if the value of the entity or collection has changed.
   */
  "@etag"?: string;
  /**
   * The metadataEtag control information MAY appear in a response in order to specify the entity tag (ETag)
   * that can be used to determine the version of the metadata of the response.
   * If an ETag is returned when requesting the metadata document, then the service SHOULD set the metadataEtag
   * control information to the metadata document's ETag in all responses when using metadata=minimal or metadata=full.
   *
   * If no ETag is returned when requesting the metadata document, then the service SHOULD NOT
   * set the metadataEtag control information in any responses.
   */
  "@metadataEtag"?: string;
  /**
   * The id control information contains the entity-id.
   * By convention the entity-id is identical to the canonical URL of the entity.
   *
   * The id control information MUST appear in responses if metadata=full is requested, or if metadata=minimal
   * is requested and any of a non-transient entity's key fields are omitted from the response
   * or the entity-id is not identical to the canonical URL.
   */
  "@id"?: string;

  /**
   * The readLink control information contains the read URL of the entity or collection.
   */
  "@readLink"?: string;
  /**
   * The editLink control information contains the edit URL of the entity.
   */
  "@editLink"?: string;
}

/**
 * Response to query for an EntityType or ComplexType
 *
 * Result object is directly returned.
 * Additional context attribute is merged into result object.
 */
export type ODataModelResponseV401<T> = T & ModelControlInfoV401;

/**
 * Control information of a response for a single value.
 */
export interface ValueControlInfoV401 {
  "@context"?: string;
  "@type"?: string;
}

/**
 * Response to a value query on a property.
 */
export interface ODataValueResponseV401<T> extends ValueControlInfoV401 {
  value: T;
}
