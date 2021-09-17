import { QEntityModel, Unnominalized, GuidString } from "@odata2ts/odata-query-objects";
import { ODataUriBuilder } from "@odata2ts/odata-uri-builder";

import { EntityTypeService } from "./EntityTypeService";
import { EntityBaseService } from "./EntityBaseService";
import { ODataClient, ODataModelResponse, ODataResponse, ODataCollectionResponse } from "@odata2ts/odata-client-api";

export abstract class EntitySetService<EModel, EIdType> extends EntityBaseService<EModel> {
  constructor(client: ODataClient, path: string, qModel: QEntityModel<EModel, any>) {
    super(client, path, qModel);
  }

  public create(model: Unnominalized<EModel>): ODataResponse<ODataModelResponse<Unnominalized<EModel>>> {
    return this.client.post(this.path, model);
  }

  public abstract get(id: EIdType): EntityTypeService<EModel>;

  public patch(id: EIdType, model: Partial<Unnominalized<EModel>>): ODataResponse<void> {
    return this.get(id).patch(model);
  }

  public delete(id: EIdType): ODataResponse<void> {
    return this.get(id).delete();
  }

  public query(
    queryFn?: (builder: ODataUriBuilder<EModel>, qObject: QEntityModel<EModel>) => void
  ): ODataResponse<ODataCollectionResponse<Unnominalized<EModel>>> {
    return this.client.get(this.getQueryUrl(queryFn));
  }
}
