import { QueryObject } from "@odata2ts/odata-query-objects";
import { ODataUriBuilderV4, createUriBuilderV4 } from "@odata2ts/odata-uri-builder";

import { OperationBaseService } from "../OperationBaseService";
import { ODataModelResponseV4 } from "./ResponseModelV4";

export class ServiceBaseV4<T, Q extends QueryObject> extends OperationBaseService<
  Q,
  ODataModelResponseV4<T>,
  ODataUriBuilderV4<Q>
> {
  protected createBuilder(): ODataUriBuilderV4<Q> {
    return createUriBuilderV4(this.getPath(), this.qModel);
  }
}
