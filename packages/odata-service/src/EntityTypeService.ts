import { QEntityModel } from "@odata2ts/odata-query-objects";
import { ODataUriBuilder } from "@odata2ts/odata-uri-builder";
import { ODataClient, ODataModelResponse, ODataResponse } from "@odata2ts/odata-client-api";

import { EntityBaseService } from "./EntityBaseService";

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

  public query(
    queryFn?: (builder: ODataUriBuilder<EModel>, qObject: QEntityModel<EModel>) => void
  ): ODataResponse<ODataModelResponse<EModel>> {
    return this.client.get(this.getQueryUrl(queryFn));
  }
}
