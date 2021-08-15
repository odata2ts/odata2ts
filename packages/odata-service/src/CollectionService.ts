import { QEntityModel } from "@odata2ts/odata-query-objects";
import { ODataClient, ODataModelResponse, ODataResponse } from "@odata2ts/odata-client-api";
import { EntityBaseService } from "./EntityBaseService";

export class CollectionService<T> extends EntityBaseService<T> {
  constructor(client: ODataClient, path: string, qModel: QEntityModel<T, any>) {
    super(client, path, qModel);
  }

  public create(model: T): ODataResponse<ODataModelResponse<T>> {
    return this.client.post(this.path, model);
  }

  public update(models: Array<T>): ODataResponse<void> {
    return this.client.put(this.path, models);
  }

  public delete(): ODataResponse<void> {
    return this.client.delete(this.path);
  }
}
