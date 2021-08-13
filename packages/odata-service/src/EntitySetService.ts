import { ODataClient, ODataCollectionResponse, ODataModelResponse, ODataResponse } from "@odata2ts/odata-client-api";
import { ODataUriBuilder } from "@odata2ts/odata-uri-builder";
import { QEntityModel } from "@odata2ts/odata-query-objects";

import { EntityTypeService } from "./EntityTypeService";
import { EntityIdentifier } from "./EntityModel";

export class EntitySetService<EModel, EId extends keyof EModel> {
  constructor(private client: ODataClient, private path: string, private qModel: QEntityModel<EModel, any>) {}

  private createBuilder(): ODataUriBuilder<EModel> {
    return ODataUriBuilder.create(this.path, this.qModel);
  }

  public create(model: EModel): ODataResponse<ODataModelResponse<EModel>> {
    return this.client.post(this.path, model);
  }

  public patch(id: EntityIdentifier<EModel, EId>, model: Partial<EModel>): ODataResponse<void> {
    return this.get(id).patch(model);
  }

  public delete(id: EntityIdentifier<EModel, EId>): ODataResponse<void> {
    return this.get(id).delete();
  }

  public query(
    queryFn: (builder: ODataUriBuilder<EModel>, qObject: QEntityModel<EModel>) => void
  ): ODataResponse<ODataCollectionResponse<EModel>> {
    const builder = this.createBuilder();
    queryFn(builder, this.qModel);

    return this.client.get(builder.build());
  }

  public get(id: EntityIdentifier<EModel, EId>): EntityTypeService<EModel> {
    // const path = typeof id === "string"  ? `${this.path}('${id}')` : typeof id === "number" ?  `${this.path}(${id})` :  Object.entries(id).map([key, value] => `${key}=`)
    return new EntityTypeService(this.client, this.path, this.qModel);
  }
}
