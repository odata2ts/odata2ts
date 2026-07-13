import { ODataHttpClient, ODataHttpMethods } from "@odata2ts/http-client-api";
import { ODataModelPayloadV4, ODataModelResponseV4 } from "@odata2ts/odata-core";
import { ODataQueryBuilderV4 } from "@odata2ts/odata-query-builder";
import { ModelResponseConverterV4, QueryObjectModel } from "@odata2ts/odata-query-objects";
import { ODataServiceOptionsInternal } from "../ODataServiceOptions";
import { UrlBuilderRequestCmdV4, UrlRequestCmd } from "../request";
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

  public patch(model: ODataModelPayloadV4<Partial<EditableT>>, patchOptions?: SubtypeOptions) {
    const { client, qModel, basePath, path, getDefaultHeaders, qResponseType } = this.__base;
    const { dontUseCastPathSegment, useTypeCi } = this.__base.evaluateSubtypeOptions(patchOptions);

    // add control info automatically, if required
    const data = useTypeCi ? this.__base.addTypeControlInfo(model) : model;

    return new UrlRequestCmd<ClientType, ODataModelResponseV4<T> | void, ODataModelPayloadV4<Partial<EditableT>>>(
      client,
      ODataHttpMethods.Patch,
      dontUseCastPathSegment ? basePath : path,
      data,
      {
        headers: getDefaultHeaders(),
        mainRequestConverter: qModel,
        mainResponseConverter: new ModelResponseConverterV4(qResponseType),
      },
    );
  }

  public update(model: ODataModelPayloadV4<EditableT>, updateOptions?: SubtypeOptions) {
    const { client, basePath, path, getDefaultHeaders, qResponseType } = this.__base;
    const { dontUseCastPathSegment, useTypeCi } = this.__base.evaluateSubtypeOptions(updateOptions);

    // add control info automatically, if required
    const data = useTypeCi ? this.__base.addTypeControlInfo(model) : model;

    // return convertV4ModelResponse(result, qResponseType);
    return new UrlRequestCmd<ClientType, ODataModelResponseV4<T> | void, ODataModelPayloadV4<EditableT>>(
      client,
      ODataHttpMethods.Put,
      dontUseCastPathSegment ? basePath : path,
      data,
      {
        headers: getDefaultHeaders(),
        mainRequestConverter: qResponseType,
        mainResponseConverter: new ModelResponseConverterV4(qResponseType),
      },
    );
  }

  public delete() {
    const { client, path } = this.__base;
    return new UrlRequestCmd<ClientType, void>(client, ODataHttpMethods.Delete, path, undefined);
  }

  public query<ReturnType extends Partial<T> = T>(queryFn?: (builder: ODataQueryBuilderV4<Q>, qObject: Q) => void) {
    const { client, qModel, createQueryBuilder, getDefaultHeaders, qResponseType } = this.__base;

    return new UrlBuilderRequestCmdV4<ClientType, ODataModelResponseV4<ReturnType>, Q>(
      client,
      createQueryBuilder(queryFn),
      qModel,
      {
        headers: getDefaultHeaders(),
        mainResponseConverter: new ModelResponseConverterV4(qResponseType),
      },
    );
  }
}
