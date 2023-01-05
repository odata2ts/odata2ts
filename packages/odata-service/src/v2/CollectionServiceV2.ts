import { ODataClient, ODataClientConfig, ODataResponse } from "@odata2ts/odata-client-api";
import { ODataCollectionResponseV2, ODataModelResponseV2 } from "@odata2ts/odata-core";
import { ODataUriBuilderV2 } from "@odata2ts/odata-query-builder";
import {
  PrimitiveCollectionType,
  QueryObject,
  convertV2CollectionResponse,
  convertV2ModelResponse,
} from "@odata2ts/odata-query-objects";

import { ServiceBaseV2 } from "./ServiceBaseV2";

type PrimitiveExtractor<T> = T extends PrimitiveCollectionType<infer E> ? E : T;

export class CollectionServiceV2<
  ClientType extends ODataClient,
  T,
  Q extends QueryObject,
  EditableT = PrimitiveExtractor<T>
> extends ServiceBaseV2<T, Q> {
  /**
   * Add a new item to the collection.
   *
   * @param model primitive value
   * @param requestConfig
   */
  public async add(
    model: EditableT,
    requestConfig?: ODataClientConfig<ClientType>
  ): ODataResponse<ODataModelResponseV2<T>> {
    const result = await this.doPost<ODataModelResponseV2<T>>(this.qModel.convertToOData(model), requestConfig);
    return convertV2ModelResponse(result, this.qResponseType);
  }

  /**
   * Update the whole collection.
   *
   * @param models set of primitive values
   * @param requestConfig
   */
  public update(models: Array<EditableT>, requestConfig?: ODataClientConfig<ClientType>): ODataResponse<void> {
    return this.doPut(this.qModel.convertToOData(models), requestConfig);
  }

  /**
   * Delete the whole collection.
   */
  public delete = this.doDelete;

  /**
   * Query collection.
   */
  public async query(
    queryFn?: (builder: ODataUriBuilderV2<Q>, qObject: Q) => void,
    requestConfig?: ODataClientConfig<ClientType>
  ): ODataResponse<ODataCollectionResponseV2<T>> {
    const response = await this.doQuery<ODataCollectionResponseV2<any>>(queryFn, requestConfig);
    return convertV2CollectionResponse(response, this.qResponseType);
  }
}
