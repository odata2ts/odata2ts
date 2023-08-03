import { ODataHttpClient, ODataHttpClientConfig, ODataResponse } from "@odata2ts/http-client-api";
import { ODataModelResponseV2 } from "@odata2ts/odata-core";
import { ODataQueryBuilderV2 } from "@odata2ts/odata-query-builder";
import { QueryObject, convertV2ModelResponse } from "@odata2ts/odata-query-objects";

import { MERGE_HEADERS } from "../RequestHeaders";
import { ServiceBaseV2 } from "./ServiceBaseV2";

export class EntityTypeServiceV2<
  ClientType extends ODataHttpClient,
  T,
  EditableT,
  Q extends QueryObject
> extends ServiceBaseV2<T, Q> {
  public patch(model: Partial<EditableT>, requestConfig?: ODataHttpClientConfig<ClientType>): ODataResponse<void> {
    const headers = { ...this.getDefaultHeaders(), ...MERGE_HEADERS };
    return this.client.post(this.getPath(), this.qModel.convertToOData(model), requestConfig, headers);
  }
  public update(model: EditableT, requestConfig?: ODataHttpClientConfig<ClientType>): ODataResponse<void> {
    return this.client.put(this.getPath(), this.qModel.convertToOData(model), requestConfig, this.getDefaultHeaders());
  }

  public async delete(requestConfig?: ODataHttpClientConfig<ClientType>): ODataResponse<void> {
    return this.client.delete(this.getPath(), requestConfig);
  }

  public async query<ReturnType extends Partial<T> = T>(
    queryFn?: (builder: ODataQueryBuilderV2<Q>, qObject: Q) => void,
    requestConfig?: ODataHttpClientConfig<ClientType>
  ): ODataResponse<ODataModelResponseV2<ReturnType>> {
    const response = await this.doQuery<ODataModelResponseV2<any>>(queryFn, requestConfig);
    return convertV2ModelResponse(response, this.qResponseType);
  }
}
