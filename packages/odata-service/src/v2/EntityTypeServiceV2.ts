import { ODataHttpClient, ODataHttpMethods } from "@odata2ts/http-client-api";
import { ODataEntityModelResponseV2, ODataModelResponseV4 } from "@odata2ts/odata-core";
import { ModelQueryBuilderV2 } from "@odata2ts/odata-query-builder";
import { EntityResponseConverterV2, QueryObjectModel } from "@odata2ts/odata-query-objects";
import { buildDeepEditHops, CacheKeyState, ownFqNameOf, withParams } from "../cacheKey/index.js";
import { ODataServiceOptionsInternalV2 } from "../ODataServiceOptions";
import { UrlBuilderRequestCmdV2, UrlBuilderWriteRequestCmdV2, UrlWriteRequestCmd } from "../request";
import { MERGE_HEADERS } from "../RequestHeaders.js";
import { ServiceStateHelperV2 } from "./ServiceStateHelperV2.js";

/**
 * Service for a single, already addressed entity: it updates, patches, deletes and reads it, but never
 * creates one - that is the entity set's business. So the only write shape it needs is `UpdatableT`,
 * the model without the properties that cannot change after creation. Creating an entity goes through
 * {@link EntitySetServiceV2}, which takes the editable model instead.
 */
export class EntityTypeServiceV2<T, UpdatableT, Q extends QueryObjectModel, AsV4 extends boolean = false> {
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

  /**
   * Patch (partially update) the current entity.
   * Spec: {@link https://www.odata.org/documentation/odata-version-2-0/operations/} - 2.6 Updating Entries
   *
   * While the method is called `patch` to align with V4, under the hood a `MERGE` request is sent.
   * The service should respond with status 204 and no data.
   *
   * @param model
   */
  public patch(model: Partial<UpdatableT>, queryFn?: (builder: ModelQueryBuilderV2<Q>, qObject: Q) => void) {
    const { client, qModel, getDefaultHeaders, createModelQueryBuilder, getConcurrencyOptions, cacheKeyState } =
      this.__base;
    // the If-Match header rides alongside the X-Http-Method one: a V2 patch travels as MERGE
    const headers = { ...getDefaultHeaders(), ...MERGE_HEADERS };

    const deepEditHops = cacheKeyState && buildDeepEditHops(cacheKeyState.navHops, ownFqNameOf(cacheKeyState), model);
    const stateForRequest =
      deepEditHops && cacheKeyState ? withParams(cacheKeyState, { deepEdit: deepEditHops }) : cacheKeyState;

    return new UrlBuilderWriteRequestCmdV2<undefined, Q, ModelQueryBuilderV2<Q>, Partial<UpdatableT>>(
      client,
      ODataHttpMethods.Post,
      createModelQueryBuilder(queryFn),
      qModel,
      model,
      {
        headers,
        mainRequestConverter: qModel,
        concurrency: getConcurrencyOptions(),
        cacheKeyState: stateForRequest,
      },
    );
  }

  /**
   * Update the current entity.
   * Spec: {@link https://www.odata.org/documentation/odata-version-2-0/operations/} - 2.6 Updating Entries
   *
   * The service should respond with status 204 and no data.
   *
   * @param model
   */
  public update(model: UpdatableT, queryFn?: (builder: ModelQueryBuilderV2<Q>, qObject: Q) => void) {
    const { client, qModel, getDefaultHeaders, createModelQueryBuilder, getConcurrencyOptions, cacheKeyState } =
      this.__base;

    const deepEditHops = cacheKeyState && buildDeepEditHops(cacheKeyState.navHops, ownFqNameOf(cacheKeyState), model);
    const stateForRequest =
      deepEditHops && cacheKeyState ? withParams(cacheKeyState, { deepEdit: deepEditHops }) : cacheKeyState;

    return new UrlBuilderWriteRequestCmdV2<undefined, Q, ModelQueryBuilderV2<Q>, UpdatableT>(
      client,
      ODataHttpMethods.Put,
      createModelQueryBuilder(queryFn),
      qModel,
      model,
      {
        headers: getDefaultHeaders(),
        mainRequestConverter: qModel,
        concurrency: getConcurrencyOptions(),
        cacheKeyState: stateForRequest,
      },
    );
  }

  /**
   * Delete the current entity.
   * Spec: {@link https://www.odata.org/documentation/odata-version-2-0/operations/} - 2.8 Deleting Entries
   *
   * The service should respond with status 204 and no data.
   */
  public delete() {
    const { client, path, getDefaultHeaders, getConcurrencyOptions, cacheKeyState } = this.__base;
    return new UrlWriteRequestCmd<undefined>(client, ODataHttpMethods.Delete, path, undefined, {
      headers: getDefaultHeaders(),
      concurrency: getConcurrencyOptions(),
      cacheKeyState,
    });
  }

  public query<ReturnType extends Partial<T> = T>(queryFn?: (builder: ModelQueryBuilderV2<Q>, qObject: Q) => void) {
    const { client, qModel, getDefaultHeaders, createModelQueryBuilder, getConcurrencyOptions, cacheKeyState } =
      this.__base;
    const builder = createModelQueryBuilder(queryFn);
    const ownFqName = cacheKeyState && ownFqNameOf(cacheKeyState);

    return new UrlBuilderRequestCmdV2<
      AsV4 extends true ? ODataModelResponseV4<ReturnType> : ODataEntityModelResponseV2<ReturnType>,
      Q,
      ModelQueryBuilderV2<Q>
    >(client, ODataHttpMethods.Get, builder, qModel, undefined, {
      headers: getDefaultHeaders(),
      mainResponseConverter: new EntityResponseConverterV2<ReturnType, AsV4>(qModel, this.__base.isAsV4()),
      concurrency: getConcurrencyOptions(),
      cacheKeyState,
      queryParams: builder.getCacheKeyParams(cacheKeyState?.navHops, ownFqName),
    });
  }
}
