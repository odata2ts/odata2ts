import { ODataHttpClient, ODataHttpMethods } from "@odata2ts/http-client-api";
import { ODataComplexModelResponseV2 } from "@odata2ts/odata-core";
import { ModelQueryBuilderV2 } from "@odata2ts/odata-query-builder";
import { ComplexResponseConverterV2, QueryObjectModel } from "@odata2ts/odata-query-objects";
import { ODataServiceOptions } from "../ODataServiceOptions";
import { UrlBuilderRequestCmdV2, UrlRequestCmd } from "../request";
import { MERGE_HEADERS } from "../RequestHeaders.js";
import { ServiceStateHelperV2 } from "./ServiceStateHelperV2.js";

export class ComplexTypeServiceV2<in out ClientType extends ODataHttpClient, T, EditableT, Q extends QueryObjectModel> {
  protected readonly __base: ServiceStateHelperV2<ClientType, Q>;

  protected constructor(client: ClientType, basePath: string, name: string, qModel: Q, options?: ODataServiceOptions) {
    this.__base = new ServiceStateHelperV2(client, basePath, name, qModel, options);
  }

  public getPath() {
    return this.__base.path;
  }

  public patch(model: Partial<EditableT>, queryFn?: (builder: ModelQueryBuilderV2<Q>, qObject: Q) => void) {
    const { client, qModel, getDefaultHeaders, createModelQueryBuilder } = this.__base;
    const headers = { ...getDefaultHeaders(), ...MERGE_HEADERS };

    return new UrlBuilderRequestCmdV2<ClientType, undefined, Q, ModelQueryBuilderV2<Q>, Partial<EditableT>>(
      client,
      createModelQueryBuilder(queryFn),
      qModel,
      {
        method: ODataHttpMethods.Post,
        data: model,
        headers,
        mainRequestConverter: qModel,
      },
    );
  }

  public update(model: EditableT, queryFn?: (builder: ModelQueryBuilderV2<Q>, qObject: Q) => void) {
    const { client, qModel, getDefaultHeaders, createModelQueryBuilder } = this.__base;

    return new UrlBuilderRequestCmdV2<ClientType, undefined, Q, ModelQueryBuilderV2<Q>, EditableT>(
      client,
      createModelQueryBuilder(queryFn),
      qModel,
      {
        method: ODataHttpMethods.Put,
        data: model,
        headers: getDefaultHeaders(),
        mainRequestConverter: qModel,
      },
    );
  }

  public delete() {
    const { client, path } = this.__base;

    return new UrlRequestCmd<ClientType, undefined>(client, ODataHttpMethods.Delete, path, undefined);
  }

  public query<ReturnType extends Partial<T> = T>(queryFn?: (builder: ModelQueryBuilderV2<Q>, qObject: Q) => void) {
    const { client, qModel, getDefaultHeaders, createModelQueryBuilder } = this.__base;

    return new UrlBuilderRequestCmdV2<ClientType, ODataComplexModelResponseV2<ReturnType>, Q, ModelQueryBuilderV2<Q>>(
      client,
      createModelQueryBuilder(queryFn),
      qModel,
      {
        headers: getDefaultHeaders(),
        mainResponseConverter: new ComplexResponseConverterV2(qModel),
      },
    );
  }
}
