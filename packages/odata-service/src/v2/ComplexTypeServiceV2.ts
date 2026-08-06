import { ODataHttpClient, ODataHttpMethods } from "@odata2ts/http-client-api";
import { ODataComplexModelResponseV2 } from "@odata2ts/odata-core";
import { ModelQueryBuilderV2 } from "@odata2ts/odata-query-builder";
import { ComplexResponseConverterV2, QueryObjectModel } from "@odata2ts/odata-query-objects";
import { ODataServiceOptions } from "../ODataServiceOptions";
import { UrlBuilderRequestCmdV2, UrlRequestCmd } from "../request";
import { MERGE_HEADERS } from "../RequestHeaders.js";
import { ServiceStateHelperV2 } from "./ServiceStateHelperV2.js";

export class ComplexTypeServiceV2<T, EditableT, Q extends QueryObjectModel> {
  protected readonly __base: ServiceStateHelperV2<Q>;

  protected constructor(
    client: ODataHttpClient,
    basePath: string,
    name: string,
    qModel: Q,
    options?: ODataServiceOptions,
  ) {
    this.__base = new ServiceStateHelperV2(client, basePath, name, qModel, options);
  }

  public getPath() {
    return this.__base.path;
  }

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

  public delete() {
    const { client, path } = this.__base;

    return new UrlRequestCmd<undefined>(client, ODataHttpMethods.Delete, path, undefined);
  }

  public query<ReturnType extends Partial<T> = T>(queryFn?: (builder: ModelQueryBuilderV2<Q>, qObject: Q) => void) {
    const { client, qModel, getDefaultHeaders, createModelQueryBuilder } = this.__base;

    return new UrlBuilderRequestCmdV2<ODataComplexModelResponseV2<ReturnType>, Q, ModelQueryBuilderV2<Q>>(
      client,
      ODataHttpMethods.Get,
      createModelQueryBuilder(queryFn),
      qModel,
      undefined,
      {
        headers: getDefaultHeaders(),
        mainResponseConverter: new ComplexResponseConverterV2(qModel),
      },
    );
  }
}
