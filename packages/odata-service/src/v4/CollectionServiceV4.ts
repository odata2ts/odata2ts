import { ODataClient, ODataClientConfig, ODataResponse } from "@odata2ts/odata-client-api";
import { PrimitiveCollectionType, QueryObject } from "@odata2ts/odata-query-objects";
import { ODataUriBuilderV4 } from "@odata2ts/odata-uri-builder";

import { ODataCollectionResponseV4, ODataModelResponseV4 } from "./ResponseModelV4";
import { ServiceBaseV4 } from "./ServiceBaseV4";

type PrimitiveExtractor<T> = T extends PrimitiveCollectionType<infer E> ? E : T;

export class CollectionServiceV4<
  ClientType extends ODataClient,
  T,
  Q extends QueryObject,
  EditableT = PrimitiveExtractor<T>
> extends ServiceBaseV4<T, Q> {
  /**
   * Add a new item to the collection.
   *
   * @param model primitive value
   */
  public add: (
    model: EditableT,
    requestConfig?: ODataClientConfig<ClientType>
  ) => ODataResponse<ODataModelResponseV4<T>> = this.doPost;

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
   * Query collection of primitive values.
   */
  public query: (
    queryFn?: (builder: ODataUriBuilderV4<Q>, qObject: Q) => void,
    requestConfig?: ODataClientConfig<ClientType>
  ) => ODataResponse<ODataCollectionResponseV4<T>> = this.doQuery;
}
