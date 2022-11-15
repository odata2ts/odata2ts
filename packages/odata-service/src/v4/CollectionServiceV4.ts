import { ODataClient, ODataClientConfig, ODataResponse } from "@odata2ts/odata-client-api";
import { PrimitiveCollectionType, QueryObject } from "@odata2ts/odata-query-objects";
import { ODataUriBuilderV4 } from "@odata2ts/odata-uri-builder";

import { ODataCollectionResponseV4, ODataModelResponseV4 } from "./ResponseModelV4";
import { ServiceBaseV4 } from "./ServiceBaseV4";

type PrimitiveExtractor<T> = T extends PrimitiveCollectionType<infer E> ? E : T;

export class CollectionServiceV4<
  ClientType extends ODataClient,
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
    requestConfig?: ODataClientConfig<ClientType>
  ): ODataResponse<void | ODataModelResponseV4<T>> {
    const result = await this.doPost<void | ODataModelResponseV4<T>>(this.qModel.convertToOData(model), requestConfig);
    return this.convertModelResponse(result);
  }

  /**
   * Update the whole collection.
   *
   * @param models set of primitive values
   * @param requestConfig
   */
  public async update(
    models: Array<EditableT>,
    requestConfig?: ODataClientConfig<ClientType>
  ): ODataResponse<void | ODataCollectionResponseV4<T>> {
    const result = await this.doPut<void | ODataCollectionResponseV4<T>>(
      this.qModel.convertToOData(models),
      requestConfig
    );
    return this.convertModelResponse(result);
  }

  /**
   * Delete the whole collection.
   */
  public delete = this.doDelete;

  /**
   * Query collection of primitive values.
   */
  public async query(
    queryFn?: (builder: ODataUriBuilderV4<Q>, qObject: Q) => void,
    requestConfig?: ODataClientConfig<ClientType>
  ): ODataResponse<ODataCollectionResponseV4<T>> {
    const response = await this.doQuery<ODataCollectionResponseV4<any>>(queryFn, requestConfig);
    return this.convertCollectionResponse(response);
  }
}
