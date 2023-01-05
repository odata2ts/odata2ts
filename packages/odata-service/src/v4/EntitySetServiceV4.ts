import { ODataClient, ODataClientConfig, ODataResponse } from "@odata2ts/odata-client-api";
import { ODataCollectionResponseV4, ODataModelResponseV4 } from "@odata2ts/odata-core";
import { ODataUriBuilderV4 } from "@odata2ts/odata-query-builder";
import {
  QFunction,
  QueryObject,
  convertV4CollectionResponse,
  convertV4ModelResponse,
} from "@odata2ts/odata-query-objects";

import { EntityTypeServiceV4 } from "./EntityTypeServiceV4";
import { ServiceBaseV4 } from "./ServiceBaseV4";

export abstract class EntitySetServiceV4<
  ClientType extends ODataClient,
  T,
  EditableT,
  Q extends QueryObject,
  EIdType,
  ETS extends EntityTypeServiceV4<ClientType, T, EditableT, Q>
> extends ServiceBaseV4<T, Q> {
  /**
   * Overriding the constructor to support creation of EntityTypeService from within this service.
   * Also support key spec.
   *
   * @param client the odata client responsible for data requests
   * @param basePath the base URL path
   * @param name name of the service
   * @param qModel query object
   * @param entityTypeServiceConstructor the corresponding service for a single entity
   * @param idFunction the id function
   * @protected
   */
  protected constructor(
    client: ODataClient,
    basePath: string,
    name: string,
    qModel: Q,
    protected entityTypeServiceConstructor: new (client: ODataClient, basePath: string, name: string) => ETS,
    protected idFunction: QFunction<EIdType>
  ) {
    super(client, basePath, name, qModel);
  }

  /**
   * The key specification for the given entity type.
   * Supports composite keys.
   */
  public getKeySpec() {
    return this.idFunction.getParams();
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

  /**
   * Create a new model.
   *
   * @param model
   * @param requestConfig
   * @return
   */
  public async create(
    model: EditableT,
    requestConfig?: ODataClientConfig<ClientType>
  ): ODataResponse<ODataModelResponseV4<T> | void> {
    const result = await this.doPost<ODataModelResponseV4<T> | void>(this.qModel.convertToOData(model), requestConfig);
    return convertV4ModelResponse(result, this.qResponseType);
  }

  public get(id: EIdType) {
    const url = this.idFunction.buildUrl(id);
    return new this.entityTypeServiceConstructor(this.client, this.basePath, url);
  }

  public patch(
    id: EIdType,
    model: Partial<EditableT>,
    requestConfig?: ODataClientConfig<ClientType>
  ): ODataResponse<void | ODataModelResponseV4<T>> {
    return this.get(id).patch(model, requestConfig);
  }

  public delete(id: EIdType, requestConfig?: ODataClientConfig<ClientType>): ODataResponse<void> {
    return this.get(id).delete(requestConfig);
  }

  public async query(
    queryFn?: (builder: ODataUriBuilderV4<Q>, qObject: Q) => void,
    requestConfig?: ODataClientConfig<ClientType>
  ): ODataResponse<ODataCollectionResponseV4<T>> {
    const response = await this.doQuery<ODataCollectionResponseV4<any>>(queryFn, requestConfig);
    return convertV4CollectionResponse(response, this.qResponseType);
  }
}
