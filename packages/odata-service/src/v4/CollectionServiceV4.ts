import { ODataClient, ODataModelResponse, ODataResponse, ODataCollectionResponse } from "@odata2ts/odata-client-api";

import { EntityBaseServiceV4 } from "./EntityBaseServiceV4";
import { PrimitiveCollectionType, QueryObject } from "@odata2ts/odata-query-objects";

type PrimitiveExtractor<T> = T extends PrimitiveCollectionType<infer E> ? E : T;

export class CollectionServiceV4<T, Q extends QueryObject, K = PrimitiveExtractor<T>> extends EntityBaseServiceV4<
  T,
  Q,
  ODataCollectionResponse<T>
> {
  constructor(client: ODataClient, path: string, qModel: Q) {
    super(client, path, qModel);
  }

  /**
   * Add a new item to the collection.
   *
   * @param model primitive value
   */
  public add(model: K): ODataResponse<ODataModelResponse<T>> {
    return this.client.post(this.path, model);
  }

  /**
   * Update the whole collection.
   *
   * @param models set of primitive values
   */
  public update(models: Array<K>): ODataResponse<void> {
    return this.client.put(this.path, models);
  }

  /**
   * Delete the whole collection.
   */
  public delete = this.doDelete;

  /**
   * Query collection of primitive values.
   */
  public query = this.doQuery;
}
