import { QueryObject } from "@odata2ts/odata-query-objects";
import { ODataUriBuilderV4 } from "@odata2ts/odata-uri-builder";

import { ODataCollectionResponseV4, ODataModelResponseV4 } from "./ResponseModelV4";
import { OperationBaseService } from "../OperationBaseService";

export class ServiceBaseV4<T, Q extends QueryObject> extends OperationBaseService<
  T,
  Q,
  ODataModelResponseV4<T>,
  ODataUriBuilderV4<Q>
> {
  protected createBuilder(): ODataUriBuilderV4<Q> {
    return ODataUriBuilderV4.create(this.path, this.qModel);
  }
}
