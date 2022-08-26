import { QueryObject } from "@odata2ts/odata-query-objects";

import { ServiceBaseV2 } from "./ServiceBaseV2";
import { ODataClient, ODataResponse } from "@odata2ts/odata-client-api";
import { ODataUriBuilderV2 } from "@odata2ts/odata-uri-builder";
import { ODataModelResponseV2 } from "./ResponseModelV2";
import { ODataClientConfig } from "../EntityModel";

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
