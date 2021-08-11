import { ODataUriBuilder } from "@odata2ts/odata-uri-builder";
import { QEntityModel } from "@odata2ts/odata-query-objects";
import { ODataClient } from "./odata-client/ODataClientModel";

export class CollectionService<T> {
  constructor(private client: ODataClient, private path: string, private qModel: QEntityModel<T>) {}

  private createBuilder(): ODataUriBuilder<T, any> {
    return ODataUriBuilder.create(this.path, this.qModel);
  }

  public create(model: T): Promise<T> {
    return this.client.post(this.path, model);
  }

  public update(models: Array<T>): Promise<void> {
    return this.client.update(this.path, models);
  }

  public delete(): Promise<void> {
    return this.client.delete(this.path);
  }
}
