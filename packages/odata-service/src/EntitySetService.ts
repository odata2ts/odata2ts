import { QueryObject } from "@odata2ts/odata-query-objects";
import { ODataUriBuilder } from "@odata2ts/odata-uri-builder";
import { ODataClient, ODataModelResponse, ODataResponse, ODataCollectionResponse } from "@odata2ts/odata-client-api";

import { EntityTypeService } from "./EntityTypeService";
import { EntityBaseService } from "./EntityBaseService";

export abstract class EntitySetService<T, Q extends QueryObject, EIdType> extends EntityBaseService<Q> {
  protected constructor(client: ODataClient, path: string, qModel: Q) {
    super(client, path, qModel);
  }

  public create(model: T): ODataResponse<ODataModelResponse<T>> {
    return this.client.post(this.path, model);
  }

  public abstract get(id: EIdType): EntityTypeService<T, Q>;

  public patch(id: EIdType, model: Partial<T>): ODataResponse<void> {
    return this.get(id).patch(model);
  }

  public delete(id: EIdType): ODataResponse<void> {
    return this.get(id).delete();
  }

  public query(queryFn?: (builder: ODataUriBuilder<Q>, qObject: Q) => void): ODataResponse<ODataCollectionResponse<T>> {
    return this.client.get(this.getQueryUrl(queryFn));
  }
}
