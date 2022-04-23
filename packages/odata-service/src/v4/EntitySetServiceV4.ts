import { QueryObject } from "@odata2ts/odata-query-objects";
import { ODataClient, ODataModelResponse, ODataResponse, ODataCollectionResponse } from "@odata2ts/odata-client-api";

import { EntityTypeServiceV4 } from "./EntityTypeServiceV4";
import { EntityBaseServiceV4 } from "./EntityBaseServiceV4";

export abstract class EntitySetServiceV4<T, Q extends QueryObject, EIdType> extends EntityBaseServiceV4<
  T,
  Q,
  ODataCollectionResponse<T>
> {
  protected constructor(client: ODataClient, path: string, qModel: Q) {
    super(client, path, qModel);
  }

  /**
   * Create a new model.
   *
   * @param model
   * @return
   */
  public create(model: T): ODataResponse<ODataModelResponse<T>> {
    return this.doPost(model);
  }

  public abstract get(id: EIdType): EntityTypeServiceV4<T, Q>;

  public patch(id: EIdType, model: Partial<T>): ODataResponse<void> {
    return this.get(id).patch(model);
  }

  public delete(id: EIdType): ODataResponse<void> {
    return this.get(id).delete();
  }

  public query = this.doQuery;
}
