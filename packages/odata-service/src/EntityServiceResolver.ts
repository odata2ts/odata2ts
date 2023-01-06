import { ODataClient } from "@odata2ts/odata-client-api";
import { QId } from "@odata2ts/odata-query-objects";

import { EntitySetServiceV2, EntityTypeServiceV2 } from "./v2";
import { EntitySetServiceV4, EntityTypeServiceV4 } from "./v4";

export class EntityServiceResolver<
  ClientType extends ODataClient,
  EIdType,
  TypeService extends EntityTypeServiceV2<ClientType, any, any, any> | EntityTypeServiceV4<ClientType, any, any, any>,
  SetService extends
    | EntitySetServiceV2<ClientType, any, any, any, any, any>
    | EntitySetServiceV4<ClientType, any, any, any, any, any>
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
   * @param id if present the type service is returned, otherwise the collection service
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

  /**
   * Create an OData path for an entity with a given id.
   * Might be useful for routing.
   *
   * @example createKey(1234) => myEntity(1234)
   * @example createKey({id: 1234, name: "Test"}) => myEntity(id=1234,name='Test')
   * @param id either a primitive value (single key entities only) or an object
   * @param notEncoded if set to {@code true}, special chars are not escaped
   */
  public createKey(id: EIdType, notEncoded?: boolean): string {
    const url = this.idFunction.buildUrl(id, notEncoded);
    return url.startsWith("/") ? url.substring(1) : url;
  }

  /**
   * Parse an OData path representing the id of an entity.
   * Might be useful for routing in combination with createKey.
   *
   * @example parseKey("myEntity(1234)") => 1234
   * @example parseKey("myEntity(id=1234,name='Test')") => { id: 1234, name: "Test" }
   * @param keyPath e.g. myEntity(id=1234,name='Test')
   * @param notDecoded if set to {@code true}, encoded special chars are not decoded
   */
  public parseKey(keyPath: string, notDecoded?: boolean): EIdType {
    return this.idFunction.parseUrl(keyPath, notDecoded);
  }
}
