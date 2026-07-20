import { ODataHttpClient, ODataHttpMethods } from "@odata2ts/http-client-api";
import { ODataCollectionResponseV4, ODataModelPayloadV4 } from "@odata2ts/odata-core";
import { CollectionQueryBuilderV4, ModelQueryBuilderV4 } from "@odata2ts/odata-query-builder";
import {
  CollectionResponseConverterV4,
  ModelResponseConverterV4,
  QId,
  QueryObjectModel,
} from "@odata2ts/odata-query-objects";
import { ODataServiceOptionsInternal } from "../ODataServiceOptions";
import { UrlBuilderRequestCmdV4 } from "../request";
import { EntityModificationResponseV4 } from "./ResponseTypeChoicesV4";
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
   * @example `createKey("1234")` => `"myEntity('1234')"`
   * @example `createKey({number: 1234, name: "Test"})` => `"myEntity(number=1234,name='Test')"`
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
   * @example `parseKey("myEntity(1234)")` => `"1234"`
   * @example `parseKey("myEntity(id=1234,name='Test')")` => `{ id: 1234, name: "Test" }`
   * @param keyPath e.g. myEntity(id=1234,name='Test')
   * @param notDecoded if set to {@code true}, encoded special chars are not decoded
   */
  public parseKey(keyPath: string, notDecoded?: boolean): EIdType {
    return this.__idFunction.parseUrl(keyPath, notDecoded ?? this.__base.isUrlNotEncoded());
  }

  /**
   * Create a new model.
   * Spec: {@link https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part1-protocol.html#sec_CreateanEntity}).
   *
   * The response of this operation is status 201 with the proper and complete model including the usually required id.
   * With a header field of "Prefer" and value "return=minimal" the OData server should respond with
   * status 204 and comes with no response data at all.
   * Both implementations have to supply the URL to the resource in the header field "Location", so you can always
   * extract the ID as part of this URL (the appropriate QId object can help parsing here).
   *
   * If you know in which way your server responds, you can easily supply this information via a boolean switch
   * to get the correct typing. `true` (default) means that the complete entity is returned, while `false` determines
   * that no data is returned, e.g. `create<false>(...)`.
   *
   * @param model
   * @param createOptions
   * @return command object for request execution
   */
  public create<Response extends boolean = true>(
    model: ODataModelPayloadV4<EditableT>,
    createOptions?: SubtypeOptions,
    queryFn?: (builder: ModelQueryBuilderV4<Q>, qObject: Q) => void,
  ) {
    const { client, basePath, path, getDefaultHeaders, qModel, createModelQueryBuilder } = this.__base;
    const { dontUseCastPathSegment, useTypeCi } = this.__base.evaluateSubtypeOptions(createOptions);

    // add control info automatically, if required
    const data = useTypeCi ? this.__base.addTypeControlInfo(model) : model;
    const actualPath = dontUseCastPathSegment ? basePath : path;

    return new UrlBuilderRequestCmdV4<
      ClientType,
      EntityModificationResponseV4<Response, T>,
      Q,
      ModelQueryBuilderV4<Q>,
      ODataModelPayloadV4<EditableT>
    >(client, ODataHttpMethods.Post, createModelQueryBuilder(queryFn, actualPath), qModel, data, {
      headers: getDefaultHeaders(),
      mainRequestConverter: qModel,
      mainResponseConverter: new ModelResponseConverterV4(qModel),
    });
  }

  /**
   * Query the entity set.
   * Spec: {@link https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part1-protocol.html#sec_QueryingCollections}
   *
   * @param queryFn provide the query logic with the help of the builder and the query-object
   */
  public query<ReturnType extends Partial<T> = T>(
    queryFn?: (builder: CollectionQueryBuilderV4<Q>, qObject: Q) => void,
  ) {
    const { client, qModel, createQueryBuilder, getDefaultHeaders } = this.__base;

    return new UrlBuilderRequestCmdV4<ClientType, ODataCollectionResponseV4<ReturnType>, Q>(
      client,
      ODataHttpMethods.Get,
      createQueryBuilder(queryFn),
      qModel,
      undefined,
      {
        headers: getDefaultHeaders(),
        mainResponseConverter: new CollectionResponseConverterV4(qModel),
      },
    );
  }
}
