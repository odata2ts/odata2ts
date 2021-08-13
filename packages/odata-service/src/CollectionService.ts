import { ODataUriBuilder } from "@odata2ts/odata-uri-builder";
import { QEntityModel } from "@odata2ts/odata-query-objects";
import { ODataClient, ODataModelResponse, ODataResponse } from "@odata2ts/odata-client-api";

export class CollectionService<T> {
  constructor(private client: ODataClient, private path: string, private qModel: QEntityModel<T>) {}

  private createBuilder(): ODataUriBuilder<T> {
    return ODataUriBuilder.create(this.path, this.qModel);
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
