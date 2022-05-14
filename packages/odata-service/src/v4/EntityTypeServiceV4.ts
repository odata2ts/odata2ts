import { ODataResponse } from "@odata2ts/odata-client-api";
import { QueryObject } from "@odata2ts/odata-query-objects";
import { ODataUriBuilderV4 } from "@odata2ts/odata-uri-builder";

import { ServiceBaseV4 } from "./ServiceBaseV4";
import { ODataModelResponseV4 } from "./ResponseModelV4";

export class EntityTypeServiceV4<T, Q extends QueryObject> extends ServiceBaseV4<T, Q> {
  public patch: (model: Partial<T>) => ODataResponse<void> = this.doPatch;

  public update: (model: T) => ODataResponse<void> = this.doPut;

  public delete: () => ODataResponse<void> = this.doDelete;

  public query: (
    queryFn?: (builder: ODataUriBuilderV4<Q>, qObject: Q) => void
  ) => ODataResponse<ODataModelResponseV4<T>> = this.doQuery;
}
