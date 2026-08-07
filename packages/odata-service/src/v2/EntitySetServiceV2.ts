import { ODataHttpClient, ODataHttpMethods } from "@odata2ts/http-client-api";
import {
  ODataCollectionResponseV2,
  ODataCollectionResponseV4,
  ODataEntityModelResponseV2,
  ODataModelResponseV4,
} from "@odata2ts/odata-core";
import { CollectionQueryBuilderV2, ModelQueryBuilderV2 } from "@odata2ts/odata-query-builder";
import {
  CollectionResponseConverterV2,
  EntityResponseConverterV2,
  QId,
  QueryObjectModel,
} from "@odata2ts/odata-query-objects";
import { ODataServiceOptionsInternalV2 } from "../ODataServiceOptions";
import { UrlBuilderRequestCmdV2 } from "../request";
import { ServiceStateHelperV2 } from "./ServiceStateHelperV2.js";

export abstract class EntitySetServiceV2<
  T,
  EditableT,
  Q extends QueryObjectModel,
  EIdType,
  AsV4 extends boolean = false,
> {
  protected readonly __base: ServiceStateHelperV2<Q, AsV4>;
  protected readonly __idFunction: QId<EIdType>;

  protected constructor(
    client: ODataHttpClient,
    basePath: string,
    name: string,
    qModel: Q,
    idFunction: QId<EIdType>,
    options?: ODataServiceOptionsInternalV2<AsV4>,
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
   * Spec: {@link https://www.odata.org/documentation/odata-version-2-0/operations/} - 2.4 Creating new Entries
   *
   * The service should respond with 201 (Created) and the newly created model.
   *
   * @param model the entity to create
   * @param queryFn additional query after the entity has been created, only $select and $expand apply here
   * @return
   */
  public create(model: EditableT, queryFn?: (builder: ModelQueryBuilderV2<Q>, qObject: Q) => void) {
    const { client, qModel, getDefaultHeaders, createModelQueryBuilder } = this.__base;

    return new UrlBuilderRequestCmdV2<
      AsV4 extends true ? ODataModelResponseV4<T> : ODataEntityModelResponseV2<T>,
      Q,
      ModelQueryBuilderV2<Q>,
      EditableT
    >(client, ODataHttpMethods.Post, createModelQueryBuilder(queryFn), qModel, model, {
      headers: getDefaultHeaders(),
      mainRequestConverter: qModel,
      mainResponseConverter: new EntityResponseConverterV2<T, AsV4>(qModel, this.__base.isAsV4()),
    });
  }

  /**
   * Query the entity set.
   *
   * @param queryFn provide the query logic with the help of the builder and the query-object
   */
  public query<ReturnType extends Partial<T> = T>(
    queryFn?: (builder: CollectionQueryBuilderV2<Q>, qObject: Q) => void,
  ) {
    const { client, qModel, getDefaultHeaders, createQueryBuilder } = this.__base;

    return new UrlBuilderRequestCmdV2<
      AsV4 extends true ? ODataCollectionResponseV4<ReturnType> : ODataCollectionResponseV2<ReturnType>,
      Q
    >(client, ODataHttpMethods.Get, createQueryBuilder(queryFn), qModel, undefined, {
      headers: getDefaultHeaders(),
      mainResponseConverter: new CollectionResponseConverterV2<ReturnType, AsV4>(qModel, this.__base.isAsV4()),
    });
  }
}
