import { ODataClient, ODataModelResponse, ODataResponse } from "@odata2ts/odata-client-api";
import { QEntityModel } from "@odata2ts/odata-query-objects";
import { ODataUriBuilder } from "@odata2ts/odata-uri-builder";

export abstract class EntityBaseService<EModel> {
  constructor(protected client: ODataClient, protected path: string, protected qModel: QEntityModel<EModel, any>) {}

  protected createBuilder(): ODataUriBuilder<EModel> {
    return ODataUriBuilder.create(this.path, this.qModel);
  }

  public getPath() {
    return this.path;
  }

  public getQOjbect() {
    return this.qModel;
  }

  protected getQueryUrl(queryFn?: (builder: ODataUriBuilder<EModel>, qObject: QEntityModel<EModel>) => void): string {
    let url = this.path;

    if (queryFn) {
      const builder = this.createBuilder();
      queryFn(builder, this.qModel);
      url = builder.build();
    }

    return url;
  }
}
