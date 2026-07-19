import { ODataHttpClient, ODataHttpMethods } from "@odata2ts/http-client-api";
import { ODataModelPayloadV4, ODataModelResponseV4 } from "@odata2ts/odata-core";
import { ModelQueryBuilderV4 } from "@odata2ts/odata-query-builder";
import { ModelResponseConverterV4, QueryObjectModel } from "@odata2ts/odata-query-objects";
import { ODataServiceOptionsInternal } from "../ODataServiceOptions";
import { UrlBuilderRequestCmdV4, UrlRequestCmd } from "../request";
import { EntityModificationResponseV4 } from "./ResponseTypeChoicesV4";
import { ServiceStateHelperV4, SubtypeOptions } from "./ServiceStateHelperV4.js";

export class EntityTypeServiceV4<in out ClientType extends ODataHttpClient, T, EditableT, Q extends QueryObjectModel> {
  protected readonly __base: ServiceStateHelperV4<ClientType, Q>;

  public constructor(
    client: ClientType,
    basePath: string,
    name: string,
    qModel: Q,
    options?: ODataServiceOptionsInternal,
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
   */
  public patch<Response extends boolean = false>(
    model: ODataModelPayloadV4<Partial<EditableT>>,
    patchOptions?: SubtypeOptions,
  ) {
    const { client, qModel, basePath, path, getDefaultHeaders } = this.__base;
    const { dontUseCastPathSegment, useTypeCi } = this.__base.evaluateSubtypeOptions(patchOptions);

    // add control info automatically, if required
    const data = useTypeCi ? this.__base.addTypeControlInfo(model) : model;

    return new UrlRequestCmd<
      ClientType,
      EntityModificationResponseV4<Response, T>,
      ODataModelPayloadV4<Partial<EditableT>>
    >(client, ODataHttpMethods.Patch, dontUseCastPathSegment ? basePath : path, data, {
      headers: getDefaultHeaders(),
      mainRequestConverter: qModel,
      mainResponseConverter: new ModelResponseConverterV4(qModel),
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
   */
  public update<Response extends boolean = false>(
    model: ODataModelPayloadV4<EditableT>,
    updateOptions?: SubtypeOptions,
  ) {
    const { client, basePath, path, getDefaultHeaders, qModel } = this.__base;
    const { dontUseCastPathSegment, useTypeCi } = this.__base.evaluateSubtypeOptions(updateOptions);

    // add control info automatically, if required
    const data = useTypeCi ? this.__base.addTypeControlInfo(model) : model;

    // return convertV4ModelResponse(result, qResponseType);
    return new UrlRequestCmd<ClientType, EntityModificationResponseV4<Response, T>, ODataModelPayloadV4<EditableT>>(
      client,
      ODataHttpMethods.Put,
      dontUseCastPathSegment ? basePath : path,
      data,
      {
        headers: getDefaultHeaders(),
        mainRequestConverter: qModel,
        mainResponseConverter: new ModelResponseConverterV4(qModel),
      },
    );
  }

  /**
   * Delete the current entity.
   *
   * Response status 204 and no content is expected.
   *
   * Spec: {@link https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part1-protocol.html#sec_DeleteanEntity}
   */
  public delete() {
    const { client, path } = this.__base;
    return new UrlRequestCmd<ClientType, undefined>(client, ODataHttpMethods.Delete, path);
  }

  /**
   * Query the entity.
   * Get back the complete entity or shape the response structure via `select` and `expand`.
   * Spec: {@link https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part1-protocol.html#sec_RequestingIndividualEntities}
   *
   * @param queryFn provide the query logic with the help of the builder and the query-object
   */
  public query<ReturnType extends Partial<T> = T>(queryFn?: (builder: ModelQueryBuilderV4<Q>, qObject: Q) => void) {
    const { client, qModel, createModelQueryBuilder, getDefaultHeaders } = this.__base;

    return new UrlBuilderRequestCmdV4<ClientType, ODataModelResponseV4<ReturnType>, Q, ModelQueryBuilderV4<Q>>(
      client,
      createModelQueryBuilder(queryFn),
      qModel,
      {
        headers: getDefaultHeaders(),
        mainResponseConverter: new ModelResponseConverterV4(qModel),
      },
    );
  }
}
