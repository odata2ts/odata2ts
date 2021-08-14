import { ODataClient, ODataCollectionResponse, ODataModelResponse, ODataResponse } from "@odata2ts/odata-client-api";
import { ODataUriBuilder } from "@odata2ts/odata-uri-builder";
import { QEntityModel } from "@odata2ts/odata-query-objects";

export class EntitySetService<EModel> {
  constructor(protected client: ODataClient, protected path: string, protected qModel: QEntityModel<EModel, any>) {}

  private createBuilder(): ODataUriBuilder<EModel> {
    return ODataUriBuilder.create(this.path, this.qModel);
  }

  public create(model: EModel): ODataResponse<ODataModelResponse<EModel>> {
    return this.client.post(this.path, model);
  }

  /* public patch(id: EntityIdentifier<EModel, EId>, model: Partial<EModel>): ODataResponse<void> {
    return this.get(id).patch(model);
  }

  public delete(id: EntityIdentifier<EModel, EId>): ODataResponse<void> {
    return this.get(id).delete();
  } */

  public query(
    queryFn: (builder: ODataUriBuilder<EModel>, qObject: QEntityModel<EModel>) => void
  ): ODataResponse<ODataCollectionResponse<EModel>> {
    const builder = this.createBuilder();
    queryFn(builder, this.qModel);

    return this.client.get(builder.build());
  }
}
