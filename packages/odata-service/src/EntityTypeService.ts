import { ODataClient, ODataModelResponse, ODataResponse } from "@odata2ts/odata-client-api";
import { QEntityModel } from "@odata2ts/odata-query-objects";
import { ODataUriBuilder } from "@odata2ts/odata-uri-builder";

export class EntityTypeService<EModel> {
  constructor(private client: ODataClient, private path: string, private qModel: QEntityModel<EModel>) {}

  private createBuilder(): ODataUriBuilder<EModel> {
    return ODataUriBuilder.create(this.path, this.qModel);
  }

  patch(model: Partial<EModel>): ODataResponse<void> {
    return this.client.patch(this.path, model);
  }

  delete(): ODataResponse<void> {
    return this.client.delete(this.path);
  }

  query(
    queryFn: (builder: ODataUriBuilder<EModel>, qObject: QEntityModel<EModel>) => void
  ): ODataResponse<ODataModelResponse<EModel> | undefined> {
    const builder = this.createBuilder();
    queryFn(builder, this.qModel);

    return this.client.get(builder.build());
  }
}
