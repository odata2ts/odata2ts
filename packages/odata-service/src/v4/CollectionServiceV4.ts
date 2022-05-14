import { ODataClient, ODataResponse } from "@odata2ts/odata-client-api";
import { PrimitiveCollectionType, QueryObject } from "@odata2ts/odata-query-objects";

import { ODataCollectionResponseV4, ODataModelResponseV4 } from "./ResponseModelV4";
import { ServiceBaseV4 } from "./ServiceBaseV4";
import { ODataUriBuilderV4 } from "@odata2ts/odata-uri-builder";

type PrimitiveExtractor<T> = T extends PrimitiveCollectionType<infer E> ? E : T;

export class CollectionServiceV4<T, Q extends QueryObject, K = PrimitiveExtractor<T>> extends ServiceBaseV4<T, Q> {
  /**
   * Add a new item to the collection.
   *
   * @param model primitive value
   */
  public add: (model: K) => ODataResponse<ODataModelResponseV4<T>> = this.doPost;

  /**
   * Update the whole collection.
   *
   * @param models set of primitive values
   */
  public update: (models: Array<K>) => ODataResponse<void> = this.doPut;

  /**
   * Delete the whole collection.
   */
  public delete = this.doDelete;

  /**
   * Query collection of primitive values.
   */
  public query: (
    queryFn?: (builder: ODataUriBuilderV4<Q>, qObject: Q) => void
  ) => ODataResponse<ODataCollectionResponseV4<T>> = this.doQuery;
}
