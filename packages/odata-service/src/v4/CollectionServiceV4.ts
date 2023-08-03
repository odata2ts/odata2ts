import { ODataHttpClient, ODataHttpClientConfig, ODataResponse } from "@odata2ts/http-client-api";
import { ODataCollectionResponseV4, ODataModelResponseV4 } from "@odata2ts/odata-core";
import { ODataQueryBuilderV4 } from "@odata2ts/odata-query-builder";
import {
  PrimitiveCollectionType,
  QueryObject,
  convertV4CollectionResponse,
  convertV4ModelResponse,
} from "@odata2ts/odata-query-objects";

import { ServiceBaseV4 } from "./ServiceBaseV4";

type PrimitiveExtractor<T> = T extends PrimitiveCollectionType<infer E> ? E : T;

export class CollectionServiceV4<
  ClientType extends ODataHttpClient,
  T,
  Q extends QueryObject,
  EditableT = PrimitiveExtractor<T>
> extends ServiceBaseV4<T, Q> {
  /**
   * Add a new item to the collection.
   *
   * @param model primitive value
   * @param requestConfig
   */
  public async add(
    model: EditableT,
    requestConfig?: ODataHttpClientConfig<ClientType>
  ): ODataResponse<void | ODataModelResponseV4<T>> {
    const result = await this.client.post<void | ODataModelResponseV4<T>>(
      this.getPath(),
      this.qModel.convertToOData(model),
      requestConfig,
      this.getDefaultHeaders()
    );
    return convertV4ModelResponse(result, this.qResponseType);
  }

  /**
   * Update the whole collection.
   *
   * @param models set of primitive values
   * @param requestConfig
   */
  public async update(
    models: Array<EditableT>,
    requestConfig?: ODataHttpClientConfig<ClientType>
  ): ODataResponse<void | ODataCollectionResponseV4<T>> {
    const result = await this.client.put<void | ODataCollectionResponseV4<T>>(
      this.getPath(),
      this.qModel.convertToOData(models),
      requestConfig,
      this.getDefaultHeaders()
    );
    return convertV4ModelResponse(result, this.qResponseType);
  }

  /**
   * Delete the whole collection.
   */
  public async delete(requestConfig?: ODataHttpClientConfig<ClientType>): ODataResponse<void> {
    return this.client.delete(this.getPath(), requestConfig);
  }

  /**
   * Query collection of primitive values.
   */
  public async query<ReturnType = T>(
    queryFn?: (builder: ODataQueryBuilderV4<Q>, qObject: Q) => void,
    requestConfig?: ODataHttpClientConfig<ClientType>
  ): ODataResponse<ODataCollectionResponseV4<ReturnType>> {
    const response = await this.doQuery<ODataCollectionResponseV4<any>>(queryFn, requestConfig);
    return convertV4CollectionResponse(response, this.qResponseType);
  }
}
