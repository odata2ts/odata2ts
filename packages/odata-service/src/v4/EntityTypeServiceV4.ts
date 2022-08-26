import { ODataClient, ODataResponse } from "@odata2ts/odata-client-api";
import { QueryObject } from "@odata2ts/odata-query-objects";
import { ODataUriBuilderV4 } from "@odata2ts/odata-uri-builder";

import { ServiceBaseV4 } from "./ServiceBaseV4";
import { ODataModelResponseV4 } from "./ResponseModelV4";
import { ODataClientConfig } from "../EntityModel";

export class EntityTypeServiceV4<
  ClientType extends ODataClient,
  T,
  EditableT,
  Q extends QueryObject
> extends ServiceBaseV4<T, Q> {
  public patch: (model: Partial<EditableT>, requestConfig?: ODataClientConfig<ClientType>) => ODataResponse<void> =
    this.doPatch;

  public update: (model: EditableT, requestConfig?: ODataClientConfig<ClientType>) => ODataResponse<void> = this.doPut;

  public delete: (requestConfig?: ODataClientConfig<ClientType>) => ODataResponse<void> = this.doDelete;

  public query: (
    queryFn?: (builder: ODataUriBuilderV4<Q>, qObject: Q) => void,
    requestConfig?: ODataClientConfig<ClientType>
  ) => ODataResponse<ODataModelResponseV4<T>> = this.doQuery;
}
