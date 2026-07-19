import { ODataHttpClient, ODataHttpMethods } from "@odata2ts/http-client-api";
import { ODataCollectionResponseV4, ODataModelPayloadV4 } from "@odata2ts/odata-core";
import { CollectionQueryBuilderV4 } from "@odata2ts/odata-query-builder";
import {
  CollectionResponseConverterV4,
  MainResponseConverter,
  PrimitiveCollectionType,
  QueryObjectModel,
} from "@odata2ts/odata-query-objects";
import { ODataServiceOptionsInternal } from "../ODataServiceOptions";
import { UrlBuilderRequestCmdV4, UrlRequestCmd } from "../request";
import { CollectionModificationResponseV4 } from "./ResponseTypeChoicesV4";
import { ServiceStateHelperV4 } from "./ServiceStateHelperV4.js";

export type PrimitiveExtractor<T> = T extends PrimitiveCollectionType<infer E> ? E : T;

export class CollectionServiceV4<
  in out ClientType extends ODataHttpClient,
  T,
  Q extends QueryObjectModel,
  PrimitiveT = PrimitiveExtractor<T>,
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
   * Spec: https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part1-protocol.html#sec_UpdateaCollectionProperty
   *
   * The response of this operation is dependent on the `Prefer` header.
   * By default, you get 204 and no response data, while adding the prefer header with `Prefer: return=representation`
   * should yield status 200 with the proper and complete model.
   *
   * If you know in which way your server responds, you can easily supply this information via a boolean switch
   * to get the correct typing. `true` means that the complete entity is returned, while `false` (default) determines
   * that no data is returned, e.g. `add<true>(...)`.
   *
   * @param model primitive value
   */
  public add<Response extends boolean = false>(model: ODataModelPayloadV4<PrimitiveT>) {
    const { path, client, getDefaultHeaders, qModel } = this.__base;

    return new UrlRequestCmd<ClientType, CollectionModificationResponseV4<Response, PrimitiveT>, PrimitiveT>(
      client,
      ODataHttpMethods.Post,
      path,
      model,
      {
        headers: getDefaultHeaders(),
        mainRequestConverter: qModel,
        mainResponseConverter: new CollectionResponseConverterV4(qModel) as MainResponseConverter<
          CollectionModificationResponseV4<Response, PrimitiveT>,
          T
        >,
      },
    );
  }

  /**
   * Update the whole collection.
   * Spec: https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part1-protocol.html#sec_UpdateaCollectionProperty
   *
   * The response of this operation is dependent on the `Prefer` header.
   * By default, you get 204 and no response data, while adding the prefer header with `Prefer: return=representation`
   * should yield status 200 with the proper and complete model.
   *
   * If you know in which way your server responds, you can easily supply this information via a boolean switch
   * to get the correct typing. `true` means that the complete entity is returned, while `false` (default) determines
   * that no data is returned, e.g. `update<true>(...).
   *
   * @param models set of primitive values
   */
  public update<Response extends boolean = false>(models: Array<ODataModelPayloadV4<PrimitiveT>>) {
    const { path, client, getDefaultHeaders, qModel } = this.__base;

    return new UrlRequestCmd<ClientType, CollectionModificationResponseV4<Response, PrimitiveT>, Array<PrimitiveT>>(
      client,
      ODataHttpMethods.Put,
      path,
      models,
      {
        headers: getDefaultHeaders(),
        mainRequestConverter: qModel,
        mainResponseConverter: new CollectionResponseConverterV4(qModel) as MainResponseConverter<
          CollectionModificationResponseV4<Response, PrimitiveT>,
          T
        >,
      },
    );
  }

  /**
   * Delete the whole collection.
   * Spec: https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part1-protocol.html#sec_UpdateaCollectionProperty
   */
  public delete() {
    const { client, path } = this.__base;

    return new UrlRequestCmd<ClientType, undefined>(client, ODataHttpMethods.Delete, path, undefined);
  }

  /**
   * Query collection of primitive values.
   * Spec: {@link https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part1-protocol.html#sec_QueryingCollections}
   *
   * @param queryFn provide the query logic with the help of the builder and the query-object
   */
  public query<ReturnType = T>(queryFn?: (builder: CollectionQueryBuilderV4<Q>, qObject: Q) => void) {
    const { client, qModel, getDefaultHeaders, createQueryBuilder } = this.__base;

    return new UrlBuilderRequestCmdV4<ClientType, ODataCollectionResponseV4<ReturnType>, Q>(
      client,
      createQueryBuilder(queryFn),
      qModel,
      {
        headers: getDefaultHeaders(),
        mainResponseConverter: new CollectionResponseConverterV4(qModel),
      },
    );
  }
}
