import { EntityTypeService } from "./EntityTypeService";
import { EntityBaseService } from "./EntityBaseService";
import { ODataClient, ODataModelResponse, ODataResponse } from "@odata2ts/odata-client-api";
import { QEntityModel } from "@odata2ts/odata-query-objects";

export abstract class EntitySetService<EModel, EIdType> extends EntityBaseService<EModel> {
  constructor(client: ODataClient, path: string, qModel: QEntityModel<EModel, any>) {
    super(client, path, qModel);
  }

  public create(model: EModel): ODataResponse<ODataModelResponse<EModel>> {
    return this.client.post(this.path, model);
  }

  public abstract get(id: EIdType): EntityTypeService<EModel>;

  public patch(id: EIdType, model: Partial<EModel>): ODataResponse<void> {
    return this.get(id).patch(model);
  }

  public delete(id: EIdType): ODataResponse<void> {
    return this.get(id).delete();
  }
}
