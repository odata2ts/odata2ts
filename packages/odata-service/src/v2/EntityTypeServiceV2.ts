import { ODataClient, ODataClientConfig, ODataResponse } from "@odata2ts/odata-client-api";
import { QueryObject } from "@odata2ts/odata-query-objects";
import { ODataUriBuilderV2 } from "@odata2ts/odata-uri-builder";

import { ODataModelResponseV2 } from "./ResponseModelV2";
import { ServiceBaseV2 } from "./ServiceBaseV2";

export class EntityTypeServiceV2<
  ClientType extends ODataClient,
  T,
  EditableT,
  Q extends QueryObject
> extends ServiceBaseV2<T, Q> {
  public patch(model: Partial<EditableT>, requestConfig?: ODataClientConfig<ClientType>): ODataResponse<void> {
    return this.doMerge(this.qModel.convertToOData(model), requestConfig);
  }

  public update(model: EditableT, requestConfig?: ODataClientConfig<ClientType>): ODataResponse<void> {
    return this.doPut(this.qModel.convertToOData(model), requestConfig);
  }

  public delete: (requestConfig?: ODataClientConfig<ClientType>) => ODataResponse<void> = this.doDelete;

  public async query(
    queryFn?: (builder: ODataUriBuilderV2<Q>, qObject: Q) => void,
    requestConfig?: ODataClientConfig<ClientType>
  ): ODataResponse<ODataModelResponseV2<T>> {
    const response = await this.doQuery<ODataModelResponseV2<any>>(queryFn, requestConfig);
    return this.convertModelResponse(response);
  }
}
