import { QueryObject } from "@odata2ts/odata-query-objects";
import { ODataClient, ODataModelResponse, ODataResponse } from "@odata2ts/odata-client-api";

import { EntityBaseServiceV4 } from "./EntityBaseServiceV4";

export class EntityTypeServiceV4<T, Q extends QueryObject> extends EntityBaseServiceV4<T, Q, ODataModelResponse<T>> {
  constructor(client: ODataClient, path: string, qModel: Q) {
    super(client, path, qModel);
  }

  public patch = this.doPatch;

  public update = this.doPut;

  public delete = this.doDelete;

  public query = this.doQuery;
}
