import { ODataHttpClient, ODataHttpMethods } from "@odata2ts/http-client-api";
import { ODataCollectionResponseV2, ODataEntityModelResponseV2 } from "@odata2ts/odata-core";
import { ODataQueryBuilderV2 } from "@odata2ts/odata-query-builder";
import {
  CollectionResponseConverterV2,
  EntityResponseConverterV2,
  PrimitiveCollectionType,
  QueryObjectModel,
} from "@odata2ts/odata-query-objects";
import { ODataServiceOptions } from "../ODataServiceOptions";
import { UrlBuilderRequestCmdV2, UrlRequestCmd } from "../request";
import { ServiceStateHelperV2 } from "./ServiceStateHelperV2.js";

type PrimitiveExtractor<T> = T extends PrimitiveCollectionType<infer E> ? E : T;

export class CollectionServiceV2<
  in out ClientType extends ODataHttpClient,
  T,
  Q extends QueryObjectModel,
  EditableT = PrimitiveExtractor<T>,
> {
  protected readonly __base: ServiceStateHelperV2<ClientType, Q>;

  public constructor(client: ClientType, basePath: string, name: string, qModel: Q, options?: ODataServiceOptions) {
    this.__base = new ServiceStateHelperV2(client, basePath, name, qModel, options);
  }

  public getPath() {
    return this.__base.path;
  }

  /**
   * Add a new item to the collection.
   *
   * @param model primitive value
   */
  public add(model: EditableT) {
    const { path, client, qModel, getDefaultHeaders, qResponseType } = this.__base;

    return new UrlRequestCmd<ClientType, ODataEntityModelResponseV2<T>, EditableT>(
      client,
      ODataHttpMethods.Post,
      path,
      model,
      {
        headers: getDefaultHeaders(),
        mainRequestConverter: qModel,
        mainResponseConverter: new EntityResponseConverterV2(qResponseType),
      },
    );
  }

  /**
   * Update the whole collection.
   *
   * @param models set of primitive values
   */
  public update(models: Array<EditableT>) {
    const { client, path, qModel, getDefaultHeaders } = this.__base;

    return new UrlRequestCmd<ClientType, void, Array<EditableT>>(client, ODataHttpMethods.Put, path, models, {
      headers: getDefaultHeaders(),
      mainRequestConverter: qModel,
    });
  }

  /**
   * Delete the whole collection.
   */
  public delete() {
    const { client, path } = this.__base;

    return new UrlRequestCmd<ClientType, void>(client, ODataHttpMethods.Delete, path, undefined);
  }

  /**
   * Query collection.
   */
  public query<ReturnType = T>(queryFn?: (builder: ODataQueryBuilderV2<Q>, qObject: Q) => void) {
    const { client, qModel, qResponseType, getDefaultHeaders, createQueryBuilder } = this.__base;

    return new UrlBuilderRequestCmdV2<ClientType, ODataCollectionResponseV2<ReturnType>, Q>(
      client,
      createQueryBuilder(queryFn),
      qModel,
      {
        headers: getDefaultHeaders(),
        mainResponseConverter: new CollectionResponseConverterV2(qResponseType),
      },
    );
  }
}
