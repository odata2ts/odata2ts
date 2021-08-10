import { ODataClient } from "./odata-client/ODataClientModel";
import { ODataUriBuilder } from "@odata2ts/odata-uri-builder";
import { QEntityModel } from "@odata2ts/odata-query-objects";
import { EntityTypeService } from "./EntityTypeService";
import { EntityIdentifier } from "./EntityModel";

export class EntitySetService<EModel, EId extends keyof EModel> {
  constructor(private client: ODataClient, private path: string, private qModel: QEntityModel<EModel>) {}

  private createBuilder(): ODataUriBuilder<EModel, EId> {
    return ODataUriBuilder.create(this.path, this.qModel);
  }

  public create(model: EModel): Promise<EModel> {
    //TODO
    return Promise.resolve(model);
  }

  public patch(id: EntityIdentifier<EModel, EId>, model: Partial<EModel>): Promise<void> {
    //TODO
    return Promise.reject("Not implemented yet!");
  }

  public delete(id: EntityIdentifier<EModel, EId>): Promise<void> {
    return this.get(id).delete();
  }

  public query(
    queryFn: (builder: ODataUriBuilder<EModel, EId>, qObject: QEntityModel<EModel>) => void
  ): Promise<Array<EModel>> {
    const builder = this.createBuilder();
    queryFn(builder, this.qModel);

    return this.client.get<Array<EModel>>(builder.build());
  }

  public get(id: EntityIdentifier<EModel, EId>): EntityTypeService<EModel, EId> {
    // const path = typeof id === "string"  ? `${this.path}('${id}')` : typeof id === "number" ?  `${this.path}(${id})` :  Object.entries(id).map([key, value] => `${key}=`)
    return new EntityTypeService(this.client, this.path, this.qModel);
  }
}
