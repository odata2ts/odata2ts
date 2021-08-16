import { QEntityModel, PrimitiveCollectionType } from "@odata2ts/odata-query-objects";
import { ODataClient, ODataModelResponse, ODataResponse } from "@odata2ts/odata-client-api";
import { EntityBaseService } from "./EntityBaseService";

type PrimitiveExtractor<T> = T extends PrimitiveCollectionType<infer E> ? E : T;

export class CollectionService<T, K = PrimitiveExtractor<T>> extends EntityBaseService<T> {
  constructor(client: ODataClient, path: string, qModel: QEntityModel<T>) {
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
}
