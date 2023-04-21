import { ODataClient } from "@odata2ts/odata-client-api";
import { QId } from "@odata2ts/odata-query-objects";

import { EntitySetServiceV2, EntityTypeServiceV2 } from "./v2";
import { EntitySetServiceV4, EntityTypeServiceV4 } from "./v4";

export class EntityServiceResolver<
  ClientType extends ODataClient,
  EIdType,
  TypeService extends EntityTypeServiceV2<ClientType, any, any, any> | EntityTypeServiceV4<ClientType, any, any, any>,
  SetService extends
    | EntitySetServiceV2<ClientType, any, any, any, any>
    | EntitySetServiceV4<ClientType, any, any, any, any>
> {
  private idFunction;
  private collectionService?: SetService;

  constructor(
    private client: ODataClient,
    private basePath: string,
    private name: string,
    idFunc: new (name: string) => QId<EIdType>,
    private entityTypeServiceConstructor: new (client: ODataClient, basePath: string, name: string) => TypeService,
    private entitySetServiceConstructor: new (client: ODataClient, basePath: string, name: string) => SetService
  ) {
    this.idFunction = new idFunc(name);
  }

  /**
   * Get EntityType service or EntityCollection service based on the id parameter.
   *
   * @param id if present the EntityType service is returned, otherwise the EntityCollection service
   */
  public get(id?: undefined): SetService;
  public get(id: EIdType): TypeService;
  public get(id?: EIdType | undefined) {
    return typeof id === "undefined" || id === null ? this.createCollectionService() : this.createTypeService(id);
  }

  private createTypeService(id: EIdType): TypeService {
    const url = this.idFunction.buildUrl(id);
    return new this.entityTypeServiceConstructor(this.client, this.basePath, url);
  }

  // cache collection service
  private createCollectionService(): SetService {
    if (!this.collectionService) {
      this.collectionService = new this.entitySetServiceConstructor(this.client, this.basePath, this.name);
    }
    return this.collectionService;
  }
}
