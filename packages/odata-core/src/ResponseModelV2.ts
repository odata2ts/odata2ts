/**
 * Response to a query for entity collections, complex collections or primitive collections.
 */
export interface ODataCollectionResponseV2<T> {
  d: {
    results: Array<EntityModelV2<T>>;
    /**
     * Count of items in the collection.
     * Only present, if OData has been instructed to do counting.
     */
    __count?: string;
    /**
     * Link (absolute URI) to next part of the result list.
     * Only present, if partial listing applies.
     *
     * @example: "__next": "https://services.odata.org/OData/OData.svc$skiptoken=12"
     */
    __next?: string;
    __metadata?: {
      uri: string;
      type?: string;
      etag?: string;
    };
  };
}

/**
 * Response to a query for an EntityType or ComplexType.
 */
export interface ODataModelResponseV2<T> {
  d: EntityModelV2<T> | ComplexModelV2<T>;
}

/**
 * Response to a query for a single property of primitive type.
 */
export interface ODataValueResponseV2<T> {
  d: { [key: string]: T };
}

export interface EntityMetaModelV2 {
  /**
   *  The value of the type name/value pair MUST be the namespace qualified name of the entity’s type.
   */
  uri: string;
  /**
   * The value of the type name/value pair MUST be the namespace qualified name of the entity’s type.
   */
  type?: string;
  /**
   * The etag name/value pair MAY be included.
   * When included, it MUST represent the concurrency token associated with the entity ETag.
   * When present, this value MUST be used instead of the ETag HTTP header.
   */
  etag?: string;

  /**
   * The id name/value pair MAY be included if the service is using OData 2.0
   * and MUST be included if the service is using OData 3.0.
   */
  id?: string;
}

export interface EnityMetaModelV3 extends EntityMetaModelV2 {
  /**
   * The value of the properties name/value pair MUST be a JSON object.
   * It SHOULD contain a name/value pair for each navigation property.
   *
   * See https://www.odata.org/documentation/odata-version-3-0/json-verbose-format/#representingnavigationpropertymetadata
   */
  properties?: Record<string, { associationuri: string }>;
  /**
   * Advertisment for actions.
   * Since V3
   *
   * See https://www.odata.org/documentation/odata-version-3-0/json-verbose-format/#advertisementforafunctionoraction
   */
  actions?: Array<{ title: string; target: string }>;
  /**
   * Advertisement for functions.
   * Since v3
   *
   * See https://www.odata.org/documentation/odata-version-3-0/json-verbose-format/#advertisementforafunctionoraction
   */
  functions?: Array<{ title: string; target: string }>;
}

export interface ComplexMetaModelV2 extends Omit<EntityMetaModelV2, "uri" | "etag" | "id"> {}

export type EntityModelV2<T> = T & {
  __metadata: EntityMetaModelV2;
};

export type ComplexModelV2<T> = T & {
  __metadata: ComplexMetaModelV2;
};

export type MediaEntityModelV2<T> = T & {
  __metadata: {
    /**
     * The value of the media_src name/value pair MUST be the source URI for the data corresponding to this MLE.
     */
    media_src: string;
    /**
     * The value of the media_etag name/value pair MUST be the concurrency token for the data corresponding to this MLE.
     */
    media_etag?: string;
    /**
     * The value of the edit_media name/value pair MUST be the edit URI for the data corresponding to this MLE.
     */
    edit_media?: string;
    /**
     * The value of the content_type name/value pair SHOULD be the MIME type of the data corresponding to this MLE.
     * This is only a hint. The actual content type will be included in a header when the resource is requested.
     */
    content_type?: string;
  };
};

/**
 * Properties which represent a relationship to another entity and which are not expanded,
 * are deferred (aka lazy loading).
 */
export interface DeferredContent {
  __deferred: {
    uri: string;
  };
}
