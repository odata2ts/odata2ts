import { EntityBaseService } from "./EntityBaseService";
import { ODataClient, ODataResponse } from "@odata2ts/odata-client-api";
import { QEntityModel } from "@odata2ts/odata-query-objects";

export class EntityTypeService<EModel> extends EntityBaseService<EModel> {
  constructor(client: ODataClient, path: string, qModel: QEntityModel<EModel, any>) {
    super(client, path, qModel);
  }

  public patch(model: Partial<EModel>): ODataResponse<void> {
    return this.client.patch(this.path, model);
  }

  public delete(): ODataResponse<void> {
    return this.client.delete(this.path);
  }
}
