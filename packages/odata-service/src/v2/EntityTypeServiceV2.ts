import { QueryObject } from "@odata2ts/odata-query-objects";

import { ServiceBaseV2 } from "./ServiceBaseV2";
import { ODataResponse } from "@odata2ts/odata-client-api";
import { ODataUriBuilderV2 } from "@odata2ts/odata-uri-builder";
import { ODataModelResponseV2 } from "./ResponseModelV2";

export class EntityTypeServiceV2<T, Q extends QueryObject> extends ServiceBaseV2<T, Q> {
  public patch: (model: Partial<T>) => ODataResponse<void> = this.doMerge;

  public update: (model: T) => ODataResponse<void> = this.doPut;

  public delete: () => ODataResponse<void> = this.doDelete;

  public query: (
    queryFn?: (builder: ODataUriBuilderV2<Q>, qObject: Q) => void
  ) => ODataResponse<ODataModelResponseV2<T>> = this.doQuery;
}
