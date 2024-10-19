import { ODataHttpClient, ODataHttpClientConfig, ODataResponse } from "@odata2ts/http-client-api";
import { ODataCollectionResponseV4, ODataModelPayloadV4, ODataModelResponseV4 } from "@odata2ts/odata-core";
import { ODataQueryBuilderV4 } from "@odata2ts/odata-query-builder";
import {
  convertV4CollectionResponse,
  convertV4ModelResponse,
  PrimitiveCollectionType,
  QueryObjectModel,
} from "@odata2ts/odata-query-objects";
import { ODataServiceOptionsInternal } from "../ODataServiceOptions";
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
   * @param requestConfig
   */
  public async add(
    model: ODataModelPayloadV4<EditableT>,
    requestConfig?: ODataHttpClientConfig<ClientType>,
  ): ODataResponse<void | ODataModelResponseV4<T>> {
    const { client, qModel, path, getDefaultHeaders, qResponseType } = this.__base;

    const result = await client.post<void | ODataModelResponseV4<T>>(
      path,
      qModel.convertToOData(model),
      requestConfig,
      getDefaultHeaders(),
    );
    return convertV4ModelResponse(result, qResponseType);
  }

  /**
   * Update the whole collection.
   *
   * @param models set of primitive values
   * @param requestConfig
   */
  public async update(
    models: Array<ODataModelPayloadV4<EditableT>>,
    requestConfig?: ODataHttpClientConfig<ClientType>,
  ): ODataResponse<void | ODataCollectionResponseV4<T>> {
    const { client, qModel, path, getDefaultHeaders, qResponseType } = this.__base;

    const result = await client.put<void | ODataCollectionResponseV4<T>>(
      path,
      qModel.convertToOData(models),
      requestConfig,
      getDefaultHeaders(),
    );
    return convertV4ModelResponse(result, qResponseType);
  }

  /**
   * Delete the whole collection.
   */
  public async delete(requestConfig?: ODataHttpClientConfig<ClientType>): ODataResponse<void> {
    const { client, path } = this.__base;

    return client.delete(path, requestConfig);
  }

  /**
   * Query collection of primitive values.
   */
  public async query<ReturnType = T>(
    queryFn?: (builder: ODataQueryBuilderV4<Q>, qObject: Q) => void,
    requestConfig?: ODataHttpClientConfig<ClientType>,
  ): ODataResponse<ODataCollectionResponseV4<ReturnType>> {
    const { client, getDefaultHeaders, applyQueryBuilder, qResponseType } = this.__base;

    const response = await client.get(applyQueryBuilder(queryFn), requestConfig, getDefaultHeaders());
    return convertV4CollectionResponse(response, qResponseType);
  }
}
