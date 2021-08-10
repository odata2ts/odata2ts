import { ODataClient } from "./odata-client/ODataClientModel";
import { QEntityModel } from "@odata2ts/odata-query-objects";
import { ODataUriBuilder } from "@odata2ts/odata-uri-builder";
import { EntityIdentifier } from "./EntityModel";

export class EntityTypeService<EModel, EId extends keyof EModel> {
  constructor(private client: ODataClient, private path: string, private qModel: QEntityModel<EModel>) {}

  private createBuilder(): ODataUriBuilder<EModel, EId> {
    return ODataUriBuilder.create(this.path, this.qModel);
  }

  patch(model: Partial<EModel>): Promise<void> {
    // TODO
    return Promise.reject("Not implemented yet!");
  }

  delete(): Promise<void> {
    // TODO
    return Promise.reject("Not implemented yet!");
  }

  query(
    queryFn: (builder: ODataUriBuilder<EModel, EId>, qObject: QEntityModel<EModel>) => void
  ): Promise<EModel | undefined> {
    const builder = this.createBuilder();
    queryFn(builder, this.qModel);

    return this.client.get(builder.build());
  }
}
