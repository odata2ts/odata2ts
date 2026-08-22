import { ODataHttpClient, ODataHttpMethods } from "@odata2ts/http-client-api";
import { ODataModelPayloadFor, ODataModelResponseFor, ODataVersionV4 } from "@odata2ts/odata-core";
import { ModelQueryBuilderV4 } from "@odata2ts/odata-query-builder";
import { ModelResponseConverterV4, QueryObjectModel } from "@odata2ts/odata-query-objects";
import { ODataServiceOptionsInternal } from "../ODataServiceOptions";
import { UrlBuilderRequestCmdV4, UrlBuilderWriteRequestCmdV4, UrlWriteRequestCmd } from "../request";
import { EntityModificationResponseV4 } from "./ResponseTypeChoicesV4";
import { ServiceStateHelperV4, SubtypeOptions } from "./ServiceStateHelperV4.js";

/**
 * Service for a single, already addressed entity: it updates, patches, deletes and reads it, but never
 * creates one - that is the entity set's business. So the only write shape it needs is `UpdatableT`,
 * the model without the properties that cannot change after creation. Creating an entity goes through
 * {@link EntitySetServiceV4}, which takes the editable model instead.
 */
export class EntityTypeServiceV4<T, UpdatableT, Q extends QueryObjectModel, V extends ODataVersionV4 = "4.0"> {
  protected readonly __base: ServiceStateHelperV4<Q, V>;

  public constructor(
    client: ODataHttpClient,
    basePath: string,
    name: string,
    qModel: Q,
    options?: ODataServiceOptionsInternal<V>,
  ) {
    this.__base = new ServiceStateHelperV4(client, basePath, name, qModel, options);
  }

  public getPath() {
    return this.__base.path;
  }

  /**
   * Patch (partially update) the current entity.
   * Spec: {@link https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part1-protocol.html#sec_UpdateanEntity}
   *
   * The response of this operation is dependent on the `Prefer` header.
   * By default, you get 204 and no response data, while adding the prefer header with `Prefer: return=representation`
   * should yield status 200 with the proper and complete model.
   *
   * If you know in which way your server responds, you can easily supply this information via a boolean switch
   * to get the correct typing. `true` means that the complete entity is returned, while `false` (default) determines
   * that no data is returned, e.g. `patch<true>(...)`.
   *
   * @param model
   * @param patchOptions
   * @param queryFn
   */
  public patch<Response extends boolean = false>(
    model: ODataModelPayloadFor<V, Partial<UpdatableT>>,
    patchOptions?: SubtypeOptions,
    queryFn?: (builder: ModelQueryBuilderV4<Q>, qObject: Q) => void,
  ) {
    const {
      client,
      qModel,
      basePath,
      path,
      getDefaultHeaders,
      getVersionHeaders,
      createModelQueryBuilder,
      getConcurrencyOptions,
    } = this.__base;
    const { dontUseCastPathSegment, useTypeCi } = this.__base.evaluateSubtypeOptions(patchOptions);

    // add control info automatically, if required
    const data = useTypeCi ? this.__base.addTypeControlInfo(model) : model;
    const actualPath = dontUseCastPathSegment ? basePath : path;

    return new UrlBuilderWriteRequestCmdV4<
      EntityModificationResponseV4<Response, T, V>,
      Q,
      ModelQueryBuilderV4<Q>,
      ODataModelPayloadFor<V, Partial<UpdatableT>>
    >(client, ODataHttpMethods.Patch, createModelQueryBuilder(queryFn, actualPath), qModel, data, {
      headers: { ...getDefaultHeaders(), ...getVersionHeaders() },
      mainRequestConverter: qModel,
      mainResponseConverter: new ModelResponseConverterV4(qModel),
      concurrency: getConcurrencyOptions(),
    });
  }

  /**
   * Update the current entity.
   * Spec: {@link https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part1-protocol.html#sec_UpdateanEntity}
   *
   * The response of this operation is dependent on the `Prefer` header.
   * By default, you get 204 and no response data, while adding the prefer header with `Prefer: return=representation`
   * should yield status 200 with the proper and complete model.
   *
   * If you know in which way your server responds, you can easily supply this information via a boolean switch
   * to get the correct typing. `true` means that the complete entity is returned, while `false` (default) determines
   * that no data is returned, e.g. `update<true>(...)`.
   *
   * @param model
   * @param updateOptions
   * @param queryFn
   */
  public update<Response extends boolean = false>(
    model: ODataModelPayloadFor<V, UpdatableT>,
    updateOptions?: SubtypeOptions,
    queryFn?: (builder: ModelQueryBuilderV4<Q>, qObject: Q) => void,
  ) {
    const {
      client,
      basePath,
      path,
      getDefaultHeaders,
      getVersionHeaders,
      qModel,
      createModelQueryBuilder,
      getConcurrencyOptions,
    } = this.__base;
    const { dontUseCastPathSegment, useTypeCi } = this.__base.evaluateSubtypeOptions(updateOptions);

    // add control info automatically, if required
    const data = useTypeCi ? this.__base.addTypeControlInfo(model) : model;
    const actualPath = dontUseCastPathSegment ? basePath : path;

    return new UrlBuilderWriteRequestCmdV4<
      EntityModificationResponseV4<Response, T, V>,
      Q,
      ModelQueryBuilderV4<Q>,
      ODataModelPayloadFor<V, UpdatableT>
    >(client, ODataHttpMethods.Put, createModelQueryBuilder(queryFn, actualPath), qModel, data, {
      headers: { ...getDefaultHeaders(), ...getVersionHeaders() },
      mainRequestConverter: qModel,
      mainResponseConverter: new ModelResponseConverterV4(qModel),
      concurrency: getConcurrencyOptions(),
    });
  }

  /**
   * Delete the current entity.
   *
   * Response status 204 and no content is expected.
   *
   * Spec: {@link https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part1-protocol.html#sec_DeleteanEntity}
   */
  public delete() {
    const { client, path, getDefaultHeaders, getConcurrencyOptions } = this.__base;
    return new UrlWriteRequestCmd<undefined>(client, ODataHttpMethods.Delete, path, undefined, {
      headers: getDefaultHeaders(),
      concurrency: getConcurrencyOptions(),
    });
  }

  /**
   * Query the entity.
   * Get back the complete entity or shape the response structure via `select` and `expand`.
   * Spec: {@link https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part1-protocol.html#sec_RequestingIndividualEntities}
   *
   * @param queryFn provide the query logic with the help of the builder and the query-object
   */
  public query<ReturnType extends Partial<T> = T>(queryFn?: (builder: ModelQueryBuilderV4<Q>, qObject: Q) => void) {
    const { client, qModel, createModelQueryBuilder, getDefaultHeaders, getConcurrencyOptions } = this.__base;

    return new UrlBuilderRequestCmdV4<ODataModelResponseFor<V, ReturnType>, Q, ModelQueryBuilderV4<Q>>(
      client,
      ODataHttpMethods.Get,
      createModelQueryBuilder(queryFn),
      qModel,
      undefined,
      {
        headers: getDefaultHeaders(),
        mainResponseConverter: new ModelResponseConverterV4(qModel),
        concurrency: getConcurrencyOptions(),
      },
    );
  }
}
