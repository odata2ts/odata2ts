import { ODataClient, ODataClientConfig, ODataResponse } from "@odata2ts/odata-client-api";
import { ODataModelResponseV4 } from "@odata2ts/odata-core";
import { QueryObject } from "@odata2ts/odata-query-objects";
import { ODataUriBuilderV4 } from "@odata2ts/odata-uri-builder";

import { ServiceBaseV4 } from "./ServiceBaseV4";

export class EntityTypeServiceV4<
  ClientType extends ODataClient,
  T,
  EditableT,
  Q extends QueryObject
> extends ServiceBaseV4<T, Q> {
  public async patch(
    model: Partial<EditableT>,
    requestConfig?: ODataClientConfig<ClientType>
  ): ODataResponse<void | ODataModelResponseV4<T>> {
    const result = await this.doPatch<void | ODataModelResponseV4<T>>(this.qModel.convertToOData(model), requestConfig);
    return this.convertModelResponse(result);
  }

  public async update(
    model: EditableT,
    requestConfig?: ODataClientConfig<ClientType>
  ): ODataResponse<void | ODataModelResponseV4<T>> {
    const result = await this.doPut<void | ODataModelResponseV4<T>>(this.qModel.convertToOData(model), requestConfig);
    return this.convertModelResponse(result);
  }

  public delete: (requestConfig?: ODataClientConfig<ClientType>) => ODataResponse<void> = this.doDelete;

  public async query(
    queryFn?: (builder: ODataUriBuilderV4<Q>, qObject: Q) => void,
    requestConfig?: ODataClientConfig<ClientType>
  ): ODataResponse<ODataModelResponseV4<T>> {
    const response = await this.doQuery<ODataModelResponseV4<any>>(queryFn, requestConfig);
    return this.convertModelResponse(response);
  }
}
