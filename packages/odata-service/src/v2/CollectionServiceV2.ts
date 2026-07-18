import { ODataHttpClient, ODataHttpMethods } from "@odata2ts/http-client-api";
import { ODataCollectionResponseV2 } from "@odata2ts/odata-core";
import { ODataQueryBuilderV2 } from "@odata2ts/odata-query-builder";
import {
  CollectionResponseConverterV2,
  MainResponseConverter,
  PrimitiveCollectionType,
  QueryObjectModel,
} from "@odata2ts/odata-query-objects";
import { ODataServiceOptions } from "../ODataServiceOptions";
import { UrlBuilderRequestCmdV2, UrlRequestCmd } from "../request";
import { CollectionModificationResponseV2 } from "./ResponseTypeChoicesV2";
import { ServiceStateHelperV2 } from "./ServiceStateHelperV2.js";

type PrimitiveExtractor<T> = T extends PrimitiveCollectionType<infer E> ? E : T;

export class CollectionServiceV2<
  in out ClientType extends ODataHttpClient,
  T,
  Q extends QueryObjectModel,
  PrimitiveT = PrimitiveExtractor<T>,
> {
  protected readonly __base: ServiceStateHelperV2<ClientType, Q>;

  public constructor(client: ClientType, basePath: string, name: string, qModel: Q, options?: ODataServiceOptions) {
    this.__base = new ServiceStateHelperV2(client, basePath, name, qModel, options);
  }

  public getPath() {
    return this.__base.path;
  }

  /**
   * Add a new item to the collection (should only work with OData V3).
   * Spec: {@link https://www.odata.org/documentation/odata-version-3-0/odata-version-3-0-core-protocol/#updateacollectionproperty}
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
  public add<Response extends boolean = false>(model: PrimitiveT) {
    const { path, client, qModel, getDefaultHeaders } = this.__base;

    return new UrlRequestCmd<ClientType, CollectionModificationResponseV2<Response, PrimitiveT>, PrimitiveT>(
      client,
      ODataHttpMethods.Post,
      path,
      model,
      {
        headers: getDefaultHeaders(),
        mainRequestConverter: qModel,
        mainResponseConverter: new CollectionResponseConverterV2(qModel) as MainResponseConverter<
          CollectionModificationResponseV2<Response, PrimitiveT>,
          T
        >,
      },
    );
  }

  /**
   * Update the whole collection.
   * Spec: {@link https://www.odata.org/documentation/odata-version-3-0/odata-version-3-0-core-protocol/#updateacollectionproperty}
   *
   * The response of this operation is dependent on the `Prefer` header.
   * By default, you get 204 and no response data, while adding the prefer header with `Prefer: return=representation`
   * should yield status 200 with the proper and complete model.
   *
   * If you know in which way your server responds, you can easily supply this information via a boolean switch
   * to get the correct typing. `true` means that the complete entity is returned, while `false` (default) determines
   * that no data is returned, e.g. `update<true>(...)`.
   *
   * @param models set of primitive values
   */
  public update<Response extends boolean = false>(models: Array<PrimitiveT>) {
    const { client, path, qModel, getDefaultHeaders } = this.__base;

    return new UrlRequestCmd<ClientType, CollectionModificationResponseV2<Response, PrimitiveT>, Array<PrimitiveT>>(
      client,
      ODataHttpMethods.Put,
      path,
      models,
      {
        headers: getDefaultHeaders(),
        mainRequestConverter: qModel,
        mainResponseConverter: new CollectionResponseConverterV2(qModel) as MainResponseConverter<
          CollectionModificationResponseV2<Response, PrimitiveT>,
          T
        >,
      },
    );
  }

  /**
   * Delete the whole collection.
   */
  public delete() {
    const { client, path } = this.__base;

    return new UrlRequestCmd<ClientType, undefined>(client, ODataHttpMethods.Delete, path, undefined);
  }

  /**
   * Query collection.
   */
  public query<ReturnType = T>(queryFn?: (builder: ODataQueryBuilderV2<Q>, qObject: Q) => void) {
    const { client, qModel, getDefaultHeaders, createQueryBuilder } = this.__base;

    return new UrlBuilderRequestCmdV2<ClientType, ODataCollectionResponseV2<ReturnType>, Q>(
      client,
      createQueryBuilder(queryFn),
      qModel,
      {
        headers: getDefaultHeaders(),
        mainResponseConverter: new CollectionResponseConverterV2(qModel),
      },
    );
  }
}
