import { ODataUriBuilder } from "@odata2ts/odata-uri-builder";
import { ODataClient, ODataModelResponse, ODataResponse, ODataCollectionResponse } from "@odata2ts/odata-client-api";

import { EntityBaseService } from "./EntityBaseService";
import { PrimitiveCollectionType, QueryObject } from "@odata2ts/odata-query-objects";

type PrimitiveExtractor<T> = T extends PrimitiveCollectionType<infer E> ? E : T;

export class CollectionService<T, Q extends QueryObject, K = PrimitiveExtractor<T>> extends EntityBaseService<Q> {
  constructor(client: ODataClient, path: string, qModel: Q) {
    super(client, path, qModel);
  }

  public add(model: K): ODataResponse<ODataModelResponse<T>> {
    return this.client.post(this.path, model);
  }

  public update(models: Array<K>): ODataResponse<void> {
    return this.client.put(this.path, models);
  }

  public delete(): ODataResponse<void> {
    return this.client.delete(this.path);
  }

  public query(queryFn?: (builder: ODataUriBuilder<Q>, qObject: Q) => void): ODataResponse<ODataCollectionResponse<T>> {
    return this.client.get(this.getQueryUrl(queryFn));
  }
}
