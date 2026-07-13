import { ODataHttpClient, ODataHttpMethods } from "@odata2ts/http-client-api";
import { ODataCollectionResponseV4, ODataModelPayloadV4, ODataModelResponseV4 } from "@odata2ts/odata-core";
import { ODataQueryBuilderV4 } from "@odata2ts/odata-query-builder";
import {
  CollectionResponseConverterV4,
  ModelResponseConverterV4,
  PrimitiveCollectionType,
  QueryObjectModel,
} from "@odata2ts/odata-query-objects";
import { ODataServiceOptionsInternal } from "../ODataServiceOptions";
import { UrlBuilderRequestCmdV4, UrlRequestCmd } from "../request";
import { ServiceStateHelperV4 } from "./ServiceStateHelperV4.js";

type PrimitiveExtractor<T> = T extends PrimitiveCollectionType<infer E> ? E : T;

export class CollectionServiceV4<
  in out ClientType extends ODataHttpClient,
  T,
  Q extends QueryObjectModel,
  EditableT = PrimitiveExtractor<T>,
> {
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
   * Add a new item to the collection.
   *
   * @param model primitive value
   */
  public add(model: ODataModelPayloadV4<EditableT>) {
    const { path, client, getDefaultHeaders, qResponseType } = this.__base;

    return new UrlRequestCmd<ClientType, void | ODataModelResponseV4<T>, EditableT>(
      client,
      ODataHttpMethods.Post,
      path,
      model,
      {
        headers: getDefaultHeaders(),
        mainRequestConverter: qResponseType,
        mainResponseConverter: new ModelResponseConverterV4(qResponseType),
      },
    );
  }

  /**
   * Update the whole collection.
   *
   * @param models set of primitive values
   */
  public update(models: Array<ODataModelPayloadV4<EditableT>>) {
    const { path, client, getDefaultHeaders, qResponseType } = this.__base;

    return new UrlRequestCmd<ClientType, void | ODataCollectionResponseV4<T>, Array<EditableT>>(
      client,
      ODataHttpMethods.Put,
      path,
      models,
      {
        headers: getDefaultHeaders(),
        mainRequestConverter: qResponseType,
        mainResponseConverter: new ModelResponseConverterV4(qResponseType),
      },
    );
  }

  /**
   * Delete the whole collection.
   */
  public delete() {
    const { client, path } = this.__base;

    return new UrlRequestCmd<ClientType, void>(client, ODataHttpMethods.Delete, path, undefined);
  }

  /**
   * Query collection of primitive values.
   */
  public query<ReturnType = T>(queryFn?: (builder: ODataQueryBuilderV4<Q>, qObject: Q) => void) {
    const { client, qModel, getDefaultHeaders, createQueryBuilder, qResponseType } = this.__base;

    return new UrlBuilderRequestCmdV4<ClientType, ODataCollectionResponseV4<ReturnType>, Q>(
      client,
      createQueryBuilder(queryFn),
      qModel,
      {
        headers: getDefaultHeaders(),
        mainResponseConverter: new CollectionResponseConverterV4(qResponseType),
      },
    );
  }
}
