import { ODataHttpClient, ODataHttpClientConfig, ODataResponse } from "@odata2ts/http-client-api";
import { ODataCollectionResponseV4, ODataModelResponseV4 } from "@odata2ts/odata-core";
import { ODataQueryBuilderV4 } from "@odata2ts/odata-query-builder";
import {
  QFunction,
  QueryObject,
  convertV4CollectionResponse,
  convertV4ModelResponse,
} from "@odata2ts/odata-query-objects";

import { ServiceBaseV4 } from "./ServiceBaseV4";

export abstract class EntitySetServiceV4<
  ClientType extends ODataHttpClient,
  T,
  EditableT,
  Q extends QueryObject,
  EIdType
> extends ServiceBaseV4<T, Q> {
  /**
   * Overriding the constructor to support creation of EntityTypeService from within this service.
   * Also support key spec.
   *
   * @param client the odata client responsible for data requests
   * @param basePath the base URL path
   * @param name name of the service
   * @param qModel query object
   * @param idFunction the id function
   * @protected
   */
  protected constructor(
    client: ODataHttpClient,
    basePath: string,
    name: string,
    qModel: Q,
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
  public async create<ReturnType extends Partial<T> | void = T>(
    model: EditableT,
    requestConfig?: ODataHttpClientConfig<ClientType>
  ): ODataResponse<ReturnType> {
    const result = await this.doPost<ODataModelResponseV4<T> | void>(this.qModel.convertToOData(model), requestConfig);
    return convertV4ModelResponse(result, this.qResponseType);
  }

  /**
   * Query the entity set.
   *
   * @param queryFn provide the query logic with the help of the builder and the query-object
   * @param requestConfig any special configurations for this request
   */
  public async query<ReturnType extends Partial<T> = T>(
    queryFn?: (builder: ODataQueryBuilderV4<Q>, qObject: Q) => void,
    requestConfig?: ODataHttpClientConfig<ClientType>
  ): ODataResponse<ODataCollectionResponseV4<ReturnType>> {
    const response = await this.doQuery<ODataCollectionResponseV4<any>>(queryFn, requestConfig);
    return convertV4CollectionResponse(response, this.qResponseType);
  }
}
