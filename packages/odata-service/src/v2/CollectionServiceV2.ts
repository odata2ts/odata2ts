import { ODataHttpClient, ODataHttpMethods } from "@odata2ts/http-client-api";
import { ODataCollectionResponseV2, ODataCollectionResponseV4 } from "@odata2ts/odata-core";
import { CollectionQueryBuilderV2, ModelQueryBuilderV2 } from "@odata2ts/odata-query-builder";
import {
  CollectionResponseConverterV2,
  MainResponseConverter,
  PrimitiveCollectionType,
  QueryObjectModel,
} from "@odata2ts/odata-query-objects";
import { CacheKeyState } from "../cacheKey/index.js";
import { ODataServiceOptionsInternalV2 } from "../ODataServiceOptions";
import { UrlBuilderRequestCmdV2, UrlRequestCmd } from "../request";
import { CollectionModificationResponseV2 } from "./ResponseTypeChoicesV2";
import { ServiceStateHelperV2 } from "./ServiceStateHelperV2.js";

type PrimitiveExtractor<T> = T extends PrimitiveCollectionType<infer E> ? E : T;

export class CollectionServiceV2<
  T,
  Q extends QueryObjectModel,
  PrimitiveT = PrimitiveExtractor<T>,
  AsV4 extends boolean = false,
> {
  protected readonly __base: ServiceStateHelperV2<Q, AsV4>;

  public constructor(
    client: ODataHttpClient,
    basePath: string,
    name: string,
    qModel: Q,
    options?: ODataServiceOptionsInternalV2<AsV4>,
    cacheKeyState?: CacheKeyState,
  ) {
    this.__base = new ServiceStateHelperV2(client, basePath, name, qModel, options, cacheKeyState);
  }

  public getPath() {
    return this.__base.path;
  }

  public getCacheKeyState() {
    return this.__base.cacheKeyState;
  }

  /**
   * Add a new item to the collection (should only work with OData V3).
   * Spec: {@link https://www.odata.org/documentation/odata-version-3-0/odata-version-3-0-core-protocol/#updateacollectionproperty}
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
   */
  public add<Response extends boolean = false>(
    model: PrimitiveT,
    queryFn?: (builder: ModelQueryBuilderV2<Q>, qObject: Q) => void,
  ) {
    const { client, qModel, getDefaultHeaders, createModelQueryBuilder, cacheKeyState } = this.__base;

    return new UrlBuilderRequestCmdV2<
      CollectionModificationResponseV2<Response, PrimitiveT, AsV4>,
      Q,
      ModelQueryBuilderV2<Q>,
      PrimitiveT
    >(client, ODataHttpMethods.Post, createModelQueryBuilder(queryFn), qModel, model, {
      headers: getDefaultHeaders(),
      mainRequestConverter: qModel,
      mainResponseConverter: new CollectionResponseConverterV2(qModel, this.__base.isAsV4()) as MainResponseConverter<
        CollectionModificationResponseV2<Response, PrimitiveT, AsV4>,
        T
      >,
      cacheKeyState,
    });
  }

  /**
   * Update the whole collection.
   * Spec: {@link https://www.odata.org/documentation/odata-version-3-0/odata-version-3-0-core-protocol/#updateacollectionproperty}
   *
   * The response of this operation is dependent on the `Prefer` header.
   * By default, you get 204 and no response data, while adding the prefer header with `Prefer: return=representation`
   * should yield status 200 with the proper and complete model.
   *
   * If you know in which way your server responds, you can easily supply this information via a boolean switch
   * to get the correct typing. `true` means that the complete entity is returned, while `false` (default) determines
   * that no data is returned, e.g. `update<true>(...)`.
   *
   * @param models set of primitive values
   */
  public update<Response extends boolean = false>(
    models: Array<PrimitiveT>,
    queryFn?: (builder: ModelQueryBuilderV2<Q>, qObject: Q) => void,
  ) {
    const { client, qModel, getDefaultHeaders, createModelQueryBuilder, cacheKeyState } = this.__base;

    return new UrlBuilderRequestCmdV2<
      CollectionModificationResponseV2<Response, PrimitiveT, AsV4>,
      Q,
      ModelQueryBuilderV2<Q>,
      Array<PrimitiveT>
    >(client, ODataHttpMethods.Put, createModelQueryBuilder(queryFn), qModel, models, {
      headers: getDefaultHeaders(),
      mainRequestConverter: qModel,
      mainResponseConverter: new CollectionResponseConverterV2(qModel, this.__base.isAsV4()) as MainResponseConverter<
        CollectionModificationResponseV2<Response, PrimitiveT, AsV4>,
        T
      >,
      cacheKeyState,
    });
  }

  /**
   * Delete the whole collection.
   */
  public delete() {
    const { client, path, cacheKeyState } = this.__base;

    return new UrlRequestCmd<undefined>(client, ODataHttpMethods.Delete, path, undefined, { cacheKeyState });
  }

  /**
   * Query collection.
   */
  public query<ReturnType = T>(queryFn?: (builder: CollectionQueryBuilderV2<Q>, qObject: Q) => void) {
    const { client, qModel, getDefaultHeaders, createQueryBuilder, cacheKeyState } = this.__base;
    const builder = createQueryBuilder(queryFn);

    return new UrlBuilderRequestCmdV2<
      AsV4 extends true ? ODataCollectionResponseV4<ReturnType> : ODataCollectionResponseV2<ReturnType>,
      Q
    >(client, ODataHttpMethods.Get, builder, qModel, undefined, {
      headers: getDefaultHeaders(),
      mainResponseConverter: new CollectionResponseConverterV2<ReturnType, AsV4>(qModel, this.__base.isAsV4()),
      cacheKeyState,
      queryParams: builder.getCacheKeyParams(),
    });
  }
}
