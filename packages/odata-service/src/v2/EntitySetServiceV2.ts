import { ODataClient, ODataResponse } from "@odata2ts/odata-client-api";
import { QueryObject } from "@odata2ts/odata-query-objects";
import { ODataUriBuilderV2 } from "@odata2ts/odata-uri-builder";

import { ODataCollectionResponseV2, ODataModelResponseV2 } from "./ResponseModelV2";
import { EntityTypeServiceV2 } from "./EntityTypeServiceV2";
import { ServiceBaseV2 } from "./ServiceBaseV2";
import { EntityKeySpec, ODataClientConfig } from "../EntityModel";
import { compileId, parseId } from "../helper/UrlHelper";
import { ParsedKey } from "../ServiceModel";

export abstract class EntitySetServiceV2<
  ClientType extends ODataClient,
  T,
  EditableT,
  Q extends QueryObject,
  EIdType,
  ETS extends EntityTypeServiceV2<ClientType, T, EditableT, Q>
> extends ServiceBaseV2<T, Q> {
  /**
   * Overriding the constructor to support creation of EntityTypeService from within this service.
   * Also support key spec.
   *
   * @param client the odata client responsible for data requests
   * @param path the base URL path
   * @param qModel query object
   * @param entityTypeServiceConstructor the corresponding service for a single entity
   * @param keySpec the specification of the key (supports composite keys) of the given entity
   * @protected
   */
  protected constructor(
    client: ODataClient,
    path: string,
    qModel: Q,
    protected entityTypeServiceConstructor: new (client: ODataClient, path: string) => ETS,
    protected keySpec: EntityKeySpec
  ) {
    super(client, path, qModel);
  }

  /**
   * The key specification for the given entity type.
   * Supports composite keys.
   */
  public getKeySpec() {
    return this.keySpec;
  }

  /**
   * Create an OData path for an entity with a given id.
   * Might be useful for routing.
   *
   * @example myEntity(1234)
   * @example myEntity(id=1234,name='Test')
   * @param id either a primitive value or an object for a composite key
   */
  public createKey(id: EIdType): string {
    return compileId(this.path.startsWith("/") ? this.path.substring(1) : this.path, this.keySpec, id);
  }

  /**
   * Parse an OData path representing the id of an entity.
   * Might be useful for routing in combination with createKey.
   *
   * @param keyPath e.g. myEntity(id=1234,name='Test')
   */
  public parseKey(keyPath: string): ParsedKey<EIdType> {
    return parseId<EIdType>(keyPath, this.keySpec);
  }

  /**
   * Create a new model.
   *
   * @param model
   * @return
   */
  public create: (
    model: EditableT,
    requestConfig?: ODataClientConfig<ClientType>
  ) => ODataResponse<ODataModelResponseV2<T>> = this.doPost;

  public get(id: EIdType) {
    const url = compileId(this.path, this.keySpec, id);
    return new this.entityTypeServiceConstructor(this.client, url);
  }

  public patch(
    id: EIdType,
    model: Partial<EditableT>,
    requestConfig?: ODataClientConfig<ClientType>
  ): ODataResponse<void> {
    return this.get(id).patch(model, requestConfig);
  }

  public delete(id: EIdType, requestConfig?: ODataClientConfig<ClientType>): ODataResponse<void> {
    return this.get(id).delete(requestConfig);
  }

  public query: (
    queryFn?: (builder: ODataUriBuilderV2<Q>, qObject: Q) => void,
    requestConfig?: ODataClientConfig<ClientType>
  ) => ODataResponse<ODataCollectionResponseV2<T>> = this.doQuery;
}
