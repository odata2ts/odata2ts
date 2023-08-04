import { ODataHttpClient, ODataHttpClientConfig, ODataResponse } from "@odata2ts/http-client-api";
import { ODataCollectionResponseV2, ODataModelResponseV2 } from "@odata2ts/odata-core";
import { ODataQueryBuilderV2 } from "@odata2ts/odata-query-builder";
import {
  PrimitiveCollectionType,
  QueryObject,
  convertV2CollectionResponse,
  convertV2ModelResponse,
} from "@odata2ts/odata-query-objects";

import { ServiceStateHelperV2 } from "./ServiceStateHelperV2";

type PrimitiveExtractor<T> = T extends PrimitiveCollectionType<infer E> ? E : T;

export class CollectionServiceV2<
  ClientType extends ODataHttpClient,
  T,
  Q extends QueryObject,
  EditableT = PrimitiveExtractor<T>
> {
  protected readonly __base: ServiceStateHelperV2<T, Q>;

  public constructor(client: ODataHttpClient, basePath: string, name: string, qModel: Q) {
    this.__base = new ServiceStateHelperV2(client, basePath, name, qModel);
  }

  public getPath() {
    return this.__base.path;
  }

  /**
   * Add a new item to the collection.
   *
   * @param model primitive value
   * @param requestConfig
   */
  public async add(
    model: EditableT,
    requestConfig?: ODataHttpClientConfig<ClientType>
  ): ODataResponse<ODataModelResponseV2<T>> {
    const { client, qModel, path, getDefaultHeaders, qResponseType } = this.__base;
    const result = await client.post<ODataModelResponseV2<T>>(
      path,
      qModel.convertToOData(model),
      requestConfig,
      getDefaultHeaders()
    );
    return convertV2ModelResponse(result, qResponseType);
  }

  /**
   * Update the whole collection.
   *
   * @param models set of primitive values
   * @param requestConfig
   */
  public update(models: Array<EditableT>, requestConfig?: ODataHttpClientConfig<ClientType>): ODataResponse<void> {
    const { client, qModel, path, getDefaultHeaders } = this.__base;

    return client.put(path, qModel.convertToOData(models), requestConfig, getDefaultHeaders());
  }

  /**
   * Delete the whole collection.
   */
  public async delete(requestConfig?: ODataHttpClientConfig<ClientType>): ODataResponse<void> {
    const { client, path } = this.__base;
    return client.delete(path, requestConfig);
  }

  /**
   * Query collection.
   */
  public async query<ReturnType = T>(
    queryFn?: (builder: ODataQueryBuilderV2<Q>, qObject: Q) => void,
    requestConfig?: ODataHttpClientConfig<ClientType>
  ): ODataResponse<ODataCollectionResponseV2<ReturnType>> {
    const { client, qResponseType, getDefaultHeaders, applyQueryBuilder } = this.__base;

    const response = await client.get<ODataCollectionResponseV2<any>>(
      applyQueryBuilder(queryFn),
      requestConfig,
      getDefaultHeaders()
    );
    return convertV2CollectionResponse(response, qResponseType);
  }
}
