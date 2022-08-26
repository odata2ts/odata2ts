import { ODataClient, ODataClientConfig, ODataResponse } from "@odata2ts/odata-client-api";
import { QueryObject } from "@odata2ts/odata-query-objects";
import { ODataUriBuilderV2 } from "@odata2ts/odata-uri-builder";

import { ServiceBaseV2 } from "./ServiceBaseV2";
import { ODataModelResponseV2 } from "./ResponseModelV2";

export class EntityTypeServiceV2<
  ClientType extends ODataClient,
  T,
  EditableT,
  Q extends QueryObject
> extends ServiceBaseV2<T, Q> {
  public patch: (model: Partial<EditableT>, requestConfig?: ODataClientConfig<ClientType>) => ODataResponse<void> =
    this.doMerge;

  public update: (model: EditableT, requestConfig?: ODataClientConfig<ClientType>) => ODataResponse<void> = this.doPut;

  public delete: (requestConfig?: ODataClientConfig<ClientType>) => ODataResponse<void> = this.doDelete;

  public query: (
    queryFn?: (builder: ODataUriBuilderV2<Q>, qObject: Q) => void,
    requestConfig?: ODataClientConfig<ClientType>
  ) => ODataResponse<ODataModelResponseV2<T>> = this.doQuery;
}
