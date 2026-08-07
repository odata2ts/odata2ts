import { ODataHttpClient, ODataHttpMethods } from "@odata2ts/http-client-api";
import { ODataEntityModelResponseV2, ODataModelResponseV4 } from "@odata2ts/odata-core";
import { ModelQueryBuilderV2 } from "@odata2ts/odata-query-builder";
import { EntityResponseConverterV2, QueryObjectModel } from "@odata2ts/odata-query-objects";
import { ODataServiceOptionsInternalV2 } from "../ODataServiceOptions";
import { UrlBuilderRequestCmdV2, UrlRequestCmd } from "../request";
import { MERGE_HEADERS } from "../RequestHeaders.js";
import { ServiceStateHelperV2 } from "./ServiceStateHelperV2.js";

export class EntityTypeServiceV2<T, EditableT, Q extends QueryObjectModel, AsV4 extends boolean = false> {
  protected readonly __base: ServiceStateHelperV2<Q, AsV4>;

  protected constructor(
    client: ODataHttpClient,
    basePath: string,
    name: string,
    qModel: Q,
    options?: ODataServiceOptionsInternalV2<AsV4>,
  ) {
    this.__base = new ServiceStateHelperV2(client, basePath, name, qModel, options);
  }

  public getPath() {
    return this.__base.path;
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
  public patch(model: Partial<EditableT>, queryFn?: (builder: ModelQueryBuilderV2<Q>, qObject: Q) => void) {
    const { client, qModel, getDefaultHeaders, createModelQueryBuilder } = this.__base;
    const headers = { ...getDefaultHeaders(), ...MERGE_HEADERS };

    return new UrlBuilderRequestCmdV2<undefined, Q, ModelQueryBuilderV2<Q>, Partial<EditableT>>(
      client,
      ODataHttpMethods.Post,
      createModelQueryBuilder(queryFn),
      qModel,
      model,
      {
        headers,
        mainRequestConverter: qModel,
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
  public update(model: EditableT, queryFn?: (builder: ModelQueryBuilderV2<Q>, qObject: Q) => void) {
    const { client, qModel, getDefaultHeaders, createModelQueryBuilder } = this.__base;

    return new UrlBuilderRequestCmdV2<undefined, Q, ModelQueryBuilderV2<Q>, EditableT>(
      client,
      ODataHttpMethods.Put,
      createModelQueryBuilder(queryFn),
      qModel,
      model,
      {
        headers: getDefaultHeaders(),
        mainRequestConverter: qModel,
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
    const { client, path } = this.__base;
    return new UrlRequestCmd<undefined>(client, ODataHttpMethods.Delete, path, undefined);
  }

  public query<ReturnType extends Partial<T> = T>(queryFn?: (builder: ModelQueryBuilderV2<Q>, qObject: Q) => void) {
    const { client, qModel, getDefaultHeaders, createModelQueryBuilder } = this.__base;

    return new UrlBuilderRequestCmdV2<
      AsV4 extends true ? ODataModelResponseV4<ReturnType> : ODataEntityModelResponseV2<ReturnType>,
      Q,
      ModelQueryBuilderV2<Q>
    >(client, ODataHttpMethods.Get, createModelQueryBuilder(queryFn), qModel, undefined, {
      headers: getDefaultHeaders(),
      mainResponseConverter: new EntityResponseConverterV2<ReturnType, AsV4>(qModel, this.__base.isAsV4()),
    });
  }
}
