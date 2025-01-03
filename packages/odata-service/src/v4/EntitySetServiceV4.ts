import { ODataHttpClient, ODataHttpClientConfig, ODataResponse } from "@odata2ts/http-client-api";
import { ODataCollectionResponseV4, ODataModelPayloadV4, ODataModelResponseV4 } from "@odata2ts/odata-core";
import { ODataQueryBuilderV4 } from "@odata2ts/odata-query-builder";
import {
  convertV4CollectionResponse,
  convertV4ModelResponse,
  QId,
  QueryObjectModel,
} from "@odata2ts/odata-query-objects";
import { ODataServiceOptionsInternal } from "../ODataServiceOptions";
import { ServiceStateHelperV4, SubtypeOptions } from "./ServiceStateHelperV4.js";

export abstract class EntitySetServiceV4<
  in out ClientType extends ODataHttpClient,
  T,
  EditableT,
  Q extends QueryObjectModel,
  EIdType,
> {
  protected readonly __base: ServiceStateHelperV4<ClientType, Q>;
  protected readonly __idFunction: QId<EIdType>;

  /**
   * Overriding the constructor to support creation of EntityTypeService from within this service.
   * Also support key spec.
   *
   * @param client the odata client responsible for data requests
   * @param basePath the base URL path
   * @param name name of the service
   * @param qModel query object
   * @param idFunction the id function
   * @param options
   * @protected
   */
  protected constructor(
    client: ClientType,
    basePath: string,
    name: string,
    qModel: Q,
    idFunction: QId<EIdType>,
    options?: ODataServiceOptionsInternal,
  ) {
    this.__base = new ServiceStateHelperV4(client, basePath, name, qModel, options);
    this.__idFunction = idFunction;
  }

  public getPath() {
    return this.__base.path;
  }

  /**
   * The key specification for the given entity type.
   * Supports composite keys.
   */
  public getKeySpec() {
    return this.__idFunction.getParams();
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
    const url = this.__idFunction.buildUrl(id, notEncoded ?? this.__base.isUrlNotEncoded());
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
    return this.__idFunction.parseUrl(keyPath, notDecoded ?? this.__base.isUrlNotEncoded());
  }

  /**
   * Create a new model.
   *
   * @param model
   * @param requestConfig
   * @param createOptions
   * @return
   */
  public async create<ReturnType extends Partial<T> | void = T>(
    model: ODataModelPayloadV4<EditableT>,
    requestConfig?: ODataHttpClientConfig<ClientType>,
    createOptions?: SubtypeOptions,
  ): ODataResponse<ODataModelResponseV4<ReturnType>> {
    const { client, qModel, basePath, path, getDefaultHeaders, qResponseType } = this.__base;
    const { dontUseCastPathSegment, useTypeCi } = this.__base.evaluateSubtypeOptions(createOptions);

    const result = await client.post<ODataModelResponseV4<T> | void>(
      dontUseCastPathSegment ? basePath : path,
      qModel.convertToOData(useTypeCi ? this.__base.addTypeControlInfo(model) : model),
      requestConfig,
      getDefaultHeaders(),
    );
    return convertV4ModelResponse(result, qResponseType);
  }

  /**
   * Query the entity set.
   *
   * @param queryFn provide the query logic with the help of the builder and the query-object
   * @param requestConfig any special configurations for this request
   */
  public async query<ReturnType extends Partial<T> = T>(
    queryFn?: (builder: ODataQueryBuilderV4<Q>, qObject: Q) => void,
    requestConfig?: ODataHttpClientConfig<ClientType>,
  ): ODataResponse<ODataCollectionResponseV4<ReturnType>> {
    const { client, qResponseType, applyQueryBuilder, getDefaultHeaders } = this.__base;

    const response = await client.get(applyQueryBuilder(queryFn), requestConfig, getDefaultHeaders());
    return convertV4CollectionResponse(response, qResponseType);
  }
}
