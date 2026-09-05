import { ODataHttpClient, ODataHttpMethods } from "@odata2ts/http-client-api";
import { ODataCollectionResponseFor, ODataVersionV4 } from "@odata2ts/odata-core";
import { CollectionQueryBuilderV4, ModelQueryBuilderV4 } from "@odata2ts/odata-query-builder";
import {
  CollectionResponseConverterV4,
  MainResponseConverter,
  PrimitiveCollectionType,
  QueryObjectModel,
} from "@odata2ts/odata-query-objects";
import { CacheKeyState } from "../cacheKey/index.js";
import { ODataServiceOptionsInternal } from "../ODataServiceOptions";
import { UrlBuilderRequestCmdV4, UrlRequestCmd } from "../request";
import { CollectionModificationResponseV4 } from "./ResponseTypeChoicesV4";
import { ServiceStateHelperV4 } from "./ServiceStateHelperV4.js";

export type PrimitiveExtractor<T> = T extends PrimitiveCollectionType<infer E> ? E : T;

/**
 * Wraps the payload of a collection property update, which the spec represents as an object with a
 * `value` property - not as a bare array.
 * Spec: {@link https://docs.oasis-open.org/odata/odata-json-format/v4.01/odata-json-format-v4.01.html#sec_CollectionofPrimitiveValues}
 *
 * Sending the bare array is accepted by servers and *silently empties the collection*, which is how this
 * went unnoticed. `PrimitiveTypeServiceV4` has always wrapped the single-value equivalent the same way.
 */
class CollectionRequestConverter<T> {
  constructor(private qModel: Pick<QueryObjectModel<T>, "convertToOData">) {}

  convertToOData(userModel: T): any {
    return { value: this.qModel.convertToOData(userModel) };
  }
}

export class CollectionServiceV4<
  T,
  Q extends QueryObjectModel,
  PrimitiveT = PrimitiveExtractor<T>,
  V extends ODataVersionV4 = "4.0",
> {
  protected readonly __base: ServiceStateHelperV4<Q, V>;

  public constructor(
    client: ODataHttpClient,
    basePath: string,
    name: string,
    qModel: Q,
    options?: ODataServiceOptionsInternal<V>,
    cacheKeyState?: CacheKeyState,
  ) {
    this.__base = new ServiceStateHelperV4(client, basePath, name, qModel, options, cacheKeyState);
  }

  public getPath() {
    return this.__base.path;
  }

  public getCacheKeyState() {
    return this.__base.cacheKeyState;
  }

  /**
   * Add a new item to the collection.
   * Spec: https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part1-protocol.html#sec_UpdateaCollectionProperty
   *
   * The response of this operation is dependent on the `Prefer` header.
   * By default, you get 204 and no response data, while adding the prefer header with `Prefer: return=representation`
   * should yield status 200 with the proper and complete model.
   *
   * If you know in which way your server responds, you can easily supply this information via a boolean switch
   * to get the correct typing. `true` means that the complete entity is returned, while `false` (default) determines
   * that no data is returned, e.g. `add<true>(...)`.
   *
   * @param model primitive value
   * @param queryFn
   */
  public add<Response extends boolean = false>(
    model: PrimitiveT,
    queryFn?: (builder: ModelQueryBuilderV4<Q>, qObject: Q) => void,
  ) {
    const { client, getDefaultHeaders, getVersionHeaders, qModel, createModelQueryBuilder, cacheKeyState } =
      this.__base;
    const builder = createModelQueryBuilder(queryFn);

    return new UrlBuilderRequestCmdV4<
      CollectionModificationResponseV4<Response, PrimitiveT, V>,
      Q,
      ModelQueryBuilderV4<Q>,
      PrimitiveT
    >(client, ODataHttpMethods.Post, builder, qModel, model, {
      headers: { ...getDefaultHeaders(), ...getVersionHeaders() },
      mainRequestConverter: qModel,
      mainResponseConverter: new CollectionResponseConverterV4(qModel) as MainResponseConverter<
        CollectionModificationResponseV4<Response, PrimitiveT, V>,
        T
      >,
      cacheKeyState,
    });
  }

  /**
   * Update the whole collection.
   * Spec: https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part1-protocol.html#sec_UpdateaCollectionProperty
   *
   * The response of this operation is dependent on the `Prefer` header.
   * By default, you get 204 and no response data, while adding the prefer header with `Prefer: return=representation`
   * should yield status 200 with the proper and complete model.
   *
   * If you know in which way your server responds, you can easily supply this information via a boolean switch
   * to get the correct typing. `true` means that the complete entity is returned, while `false` (default) determines
   * that no data is returned, e.g. `update<true>(...).
   *
   * @param models set of primitive values
   * @param queryFn
   */
  public update<Response extends boolean = false>(
    models: Array<PrimitiveT>,
    queryFn?: (builder: ModelQueryBuilderV4<Q>, qObject: Q) => void,
  ) {
    const { client, getDefaultHeaders, getVersionHeaders, qModel, createModelQueryBuilder, cacheKeyState } =
      this.__base;
    const builder = createModelQueryBuilder(queryFn);

    return new UrlBuilderRequestCmdV4<
      CollectionModificationResponseV4<Response, PrimitiveT, V>,
      Q,
      ModelQueryBuilderV4<Q>,
      Array<PrimitiveT>
    >(client, ODataHttpMethods.Put, builder, qModel, models, {
      headers: { ...getDefaultHeaders(), ...getVersionHeaders() },
      mainRequestConverter: new CollectionRequestConverter<Array<PrimitiveT>>(
        qModel as unknown as Pick<QueryObjectModel<Array<PrimitiveT>>, "convertToOData">,
      ),
      mainResponseConverter: new CollectionResponseConverterV4(qModel) as MainResponseConverter<
        CollectionModificationResponseV4<Response, PrimitiveT, V>,
        T
      >,
      cacheKeyState,
    });
  }

  /**
   * Delete the whole collection.
   * Spec: https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part1-protocol.html#sec_UpdateaCollectionProperty
   */
  public delete() {
    const { client, path, cacheKeyState } = this.__base;

    return new UrlRequestCmd<undefined>(client, ODataHttpMethods.Delete, path, undefined, { cacheKeyState });
  }

  /**
   * Query collection of primitive values.
   * Spec: {@link https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part1-protocol.html#sec_QueryingCollections}
   *
   * @param queryFn provide the query logic with the help of the builder and the query-object
   */
  public query<ReturnType = T>(queryFn?: (builder: CollectionQueryBuilderV4<Q>, qObject: Q) => void) {
    const { client, qModel, getDefaultHeaders, createQueryBuilder, cacheKeyState } = this.__base;
    const builder = createQueryBuilder(queryFn);

    return new UrlBuilderRequestCmdV4<ODataCollectionResponseFor<V, ReturnType>, Q>(
      client,
      ODataHttpMethods.Get,
      builder,
      qModel,
      undefined,
      {
        headers: getDefaultHeaders(),
        mainResponseConverter: new CollectionResponseConverterV4(qModel),
        cacheKeyState,
        queryParams: builder.getCacheKeyParams(),
      },
    );
  }
}
