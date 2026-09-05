import { ODataHttpClient, ODataHttpMethods } from "@odata2ts/http-client-api";
import { ODataComplexModelResponseV2, ODataModelResponseV4 } from "@odata2ts/odata-core";
import { ModelQueryBuilderV2 } from "@odata2ts/odata-query-builder";
import { ComplexResponseConverterV2, QueryObjectModel } from "@odata2ts/odata-query-objects";
import { CacheKeyState } from "../cacheKey/index.js";
import { ODataServiceOptionsInternalV2 } from "../ODataServiceOptions";
import { UrlBuilderRequestCmdV2, UrlRequestCmd } from "../request";
import { MERGE_HEADERS } from "../RequestHeaders.js";
import { ServiceStateHelperV2 } from "./ServiceStateHelperV2.js";

/**
 * Service for a complex property of an entity, addressed through its owner. Like
 * {@link EntityTypeServiceV2} it only ever writes to something that already exists - the owning entity
 * was created elsewhere - so `UpdatableT`, the model without the properties that cannot change after
 * creation, is the only write shape it needs.
 */
export class ComplexTypeServiceV2<T, UpdatableT, Q extends QueryObjectModel, AsV4 extends boolean = false> {
  protected readonly __base: ServiceStateHelperV2<Q, AsV4>;

  protected constructor(
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

  public patch(model: Partial<UpdatableT>, queryFn?: (builder: ModelQueryBuilderV2<Q>, qObject: Q) => void) {
    const { client, qModel, getDefaultHeaders, createModelQueryBuilder, cacheKeyState } = this.__base;
    const headers = { ...getDefaultHeaders(), ...MERGE_HEADERS };

    return new UrlBuilderRequestCmdV2<undefined, Q, ModelQueryBuilderV2<Q>, Partial<UpdatableT>>(
      client,
      ODataHttpMethods.Post,
      createModelQueryBuilder(queryFn),
      qModel,
      model,
      {
        headers,
        mainRequestConverter: qModel,
        cacheKeyState,
      },
    );
  }

  public update(model: UpdatableT, queryFn?: (builder: ModelQueryBuilderV2<Q>, qObject: Q) => void) {
    const { client, qModel, getDefaultHeaders, createModelQueryBuilder, cacheKeyState } = this.__base;

    return new UrlBuilderRequestCmdV2<undefined, Q, ModelQueryBuilderV2<Q>, UpdatableT>(
      client,
      ODataHttpMethods.Put,
      createModelQueryBuilder(queryFn),
      qModel,
      model,
      {
        headers: getDefaultHeaders(),
        mainRequestConverter: qModel,
        cacheKeyState,
      },
    );
  }

  public delete() {
    const { client, path, cacheKeyState } = this.__base;

    return new UrlRequestCmd<undefined>(client, ODataHttpMethods.Delete, path, undefined, { cacheKeyState });
  }

  public query<ReturnType extends Partial<T> = T>(queryFn?: (builder: ModelQueryBuilderV2<Q>, qObject: Q) => void) {
    const { client, qModel, getDefaultHeaders, createModelQueryBuilder, cacheKeyState } = this.__base;
    const builder = createModelQueryBuilder(queryFn);

    return new UrlBuilderRequestCmdV2<
      AsV4 extends true ? ODataModelResponseV4<ReturnType> : ODataComplexModelResponseV2<ReturnType>,
      Q,
      ModelQueryBuilderV2<Q>
    >(client, ODataHttpMethods.Get, builder, qModel, undefined, {
      headers: getDefaultHeaders(),
      mainResponseConverter: new ComplexResponseConverterV2<ReturnType, AsV4>(qModel, this.__base.isAsV4()),
      cacheKeyState,
      queryParams: builder.getCacheKeyParams(),
    });
  }
}
