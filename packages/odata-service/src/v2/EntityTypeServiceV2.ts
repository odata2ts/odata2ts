import { ODataHttpClient, ODataHttpClientConfig, ODataResponse } from "@odata2ts/http-client-api";
import { ODataModelResponseV2 } from "@odata2ts/odata-core";
import { ODataQueryBuilderV2 } from "@odata2ts/odata-query-builder";
import { QueryObject, convertV2ModelResponse } from "@odata2ts/odata-query-objects";

import { ServiceBaseV2 } from "./ServiceBaseV2";

export class EntityTypeServiceV2<
  ClientType extends ODataHttpClient,
  T,
  EditableT,
  Q extends QueryObject
> extends ServiceBaseV2<T, Q> {
  public patch(model: Partial<EditableT>, requestConfig?: ODataHttpClientConfig<ClientType>): ODataResponse<void> {
    return this.doMerge(this.qModel.convertToOData(model), requestConfig);
  }

  public update(model: EditableT, requestConfig?: ODataHttpClientConfig<ClientType>): ODataResponse<void> {
    return this.doPut(this.qModel.convertToOData(model), requestConfig);
  }

  public delete: (requestConfig?: ODataHttpClientConfig<ClientType>) => ODataResponse<void> = this.doDelete;

  public async query<ReturnType extends Partial<T> = T>(
    queryFn?: (builder: ODataQueryBuilderV2<Q>, qObject: Q) => void,
    requestConfig?: ODataHttpClientConfig<ClientType>
  ): ODataResponse<ODataModelResponseV2<ReturnType>> {
    const response = await this.doQuery<ODataModelResponseV2<any>>(queryFn, requestConfig);
    return convertV2ModelResponse(response, this.qResponseType);
  }
}
