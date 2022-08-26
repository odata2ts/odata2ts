import { ODataClient, ODataClientConfig, ODataResponse } from "@odata2ts/odata-client-api";
import { ODataUriBuilderV2 } from "@odata2ts/odata-uri-builder";
import { PrimitiveCollectionType, QueryObject } from "@odata2ts/odata-query-objects";

import { ODataCollectionResponseV2, ODataModelResponseV2 } from "./ResponseModelV2";
import { ServiceBaseV2 } from "./ServiceBaseV2";

type PrimitiveExtractor<T> = T extends PrimitiveCollectionType<infer E> ? E : T;

export class CollectionServiceV2<
  ClientType extends ODataClient,
  T,
  Q extends QueryObject,
  EditableT = PrimitiveExtractor<T>
> extends ServiceBaseV2<T, Q> {
  /**
   * Add a new item to the collection.
   *
   * @param model primitive value
   */
  public add: (
    model: EditableT,
    requestConfig?: ODataClientConfig<ClientType>
  ) => ODataResponse<ODataModelResponseV2<T>> = this.doPost;

  /**
   * Update the whole collection.
   *
   * @param models set of primitive values
   */
  public update: (models: Array<EditableT>, requestConfig?: ODataClientConfig<ClientType>) => ODataResponse<void> =
    this.doPut;

  /**
   * Delete the whole collection.
   */
  public delete = this.doDelete;

  /**
   * Query collection.
   */
  public query: (
    queryFn?: (builder: ODataUriBuilderV2<Q>, qObject: Q, requestConfig?: ODataClientConfig<ClientType>) => void
  ) => ODataResponse<ODataCollectionResponseV2<T>> = this.doQuery;
}
