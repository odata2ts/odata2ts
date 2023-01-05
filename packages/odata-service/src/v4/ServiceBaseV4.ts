import { ODataUriBuilderV4, createUriBuilderV4 } from "@odata2ts/odata-query-builder";
import { QueryObject } from "@odata2ts/odata-query-objects";

import { OperationBaseService } from "../OperationBaseService";

export class ServiceBaseV4<T, Q extends QueryObject> extends OperationBaseService<Q, ODataUriBuilderV4<Q>> {
  protected createBuilder(): ODataUriBuilderV4<Q> {
    return createUriBuilderV4(this.getPath(), this.qModel);
  }
}
