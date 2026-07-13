import { ODataHttpClient, ODataHttpMethods } from "@odata2ts/http-client-api";
import { ODataCollectionResponseV2, ODataEntityModelResponseV2 } from "@odata2ts/odata-core";
import { ODataQueryBuilderV2 } from "@odata2ts/odata-query-builder";
import { EntityResponseConverterV2, QId, QueryObjectModel } from "@odata2ts/odata-query-objects";
import { ODataServiceOptions } from "../ODataServiceOptions";
import { UrlBuilderRequestCmdV2, UrlRequestCmd } from "../request";
import { ServiceStateHelperV2 } from "./ServiceStateHelperV2.js";

export abstract class EntitySetServiceV2<
  in out ClientType extends ODataHttpClient,
  T,
  EditableT,
  Q extends QueryObjectModel,
  EIdType,
> {
  protected readonly __base: ServiceStateHelperV2<ClientType, Q>;
  protected readonly __idFunction: QId<EIdType>;

  protected constructor(
    client: ClientType,
    basePath: string,
    name: string,
    qModel: Q,
    idFunction: QId<EIdType>,
    options?: ODataServiceOptions,
  ) {
    this.__base = new ServiceStateHelperV2(client, basePath, name, qModel, options);
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
   * @return
   */
  public create<ReturnType extends Partial<T> = T>(model: EditableT) {
    const { path, client, qModel, qResponseType, getDefaultHeaders } = this.__base;

    return new UrlRequestCmd<ClientType, ODataEntityModelResponseV2<ReturnType>, EditableT>(
      client,
      ODataHttpMethods.Post,
      path,
      model,
      {
        headers: getDefaultHeaders(),
        mainRequestConverter: qModel,
        mainResponseConverter: new EntityResponseConverterV2(qResponseType),
      },
    );
  }

  /**
   * Query the entity set.
   *
   * @param queryFn provide the query logic with the help of the builder and the query-object
   */
  public query<ReturnType extends Partial<T> = T>(queryFn?: (builder: ODataQueryBuilderV2<Q>, qObject: Q) => void) {
    const { client, qModel, qResponseType, getDefaultHeaders, createQueryBuilder } = this.__base;

    return new UrlBuilderRequestCmdV2<ClientType, ODataCollectionResponseV2<ReturnType>, Q>(
      client,
      createQueryBuilder(queryFn),
      qModel,
      {
        headers: getDefaultHeaders(),
        mainResponseConverter: new EntityResponseConverterV2(qResponseType),
      },
    );
  }
}
