import { QueryObject } from "@odata2ts/odata-query-objects";
import { ODataUriBuilder } from "@odata2ts/odata-uri-builder";
import { ODataClient, ODataModelResponse, ODataResponse } from "@odata2ts/odata-client-api";

import { EntityBaseService } from "./EntityBaseService";

export class EntityTypeService<T, Q extends QueryObject> extends EntityBaseService<Q> {
  constructor(client: ODataClient, path: string, qModel: Q) {
    super(client, path, qModel);
  }

  public patch(model: Partial<T>): ODataResponse<void> {
    return this.client.patch(this.path, model);
  }

  public delete(): ODataResponse<void> {
    return this.client.delete(this.path);
  }

  public query(queryFn?: (builder: ODataUriBuilder<Q>, qObject: Q) => void): ODataResponse<ODataModelResponse<T>> {
    return this.client.get(this.getQueryUrl(queryFn));
  }
}
