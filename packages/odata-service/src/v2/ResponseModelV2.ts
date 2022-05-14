/**
 * Response to a collection query.
 */
export interface ODataCollectionResponseV2<T> {
  d: {
    results: Array<T>;
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
  };
}

/**
 * Response to query for an EntityType or ComplexType
 */
export interface ODataModelResponseV2<T> {
  d: EntityModelV2<T> | ComplexModelV2<T>;
}

/**
 * Response to a value query on a property.
 */
export interface ODataValueResponseV2<T> {
  d: {
    results: Partial<T>;
  };
}

export interface EntityMetaModelV2 {
  uri: string;
  type: string;
  etag?: string;
}

/**
 * Properties which represent a relationship to another entity and which are not expanded,
 * are deferred (aka lazy loading).
 */
export interface DeferredContent {
  __deferred: {
    uri: string;
  };
}

export interface ComplexMetaModelV2 extends Omit<EntityMetaModelV2, "uri" | "etag"> {}

export type EntityModelV2<T> = T & {
  __metadata: EntityMetaModelV2;
};

export type ComplexModelV2<T> = T & {
  __metadata: ComplexMetaModelV2;
};
