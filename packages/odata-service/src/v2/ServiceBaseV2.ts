import { QueryObject } from "@odata2ts/odata-query-objects";
import { ODataUriBuilderV2, createUriBuilderV2 } from "@odata2ts/odata-uri-builder";

import { OperationBaseService } from "../OperationBaseService";

export class ServiceBaseV2<T, Q extends QueryObject> extends OperationBaseService<Q, ODataUriBuilderV2<Q>> {
  protected createBuilder(): ODataUriBuilderV2<Q> {
    return createUriBuilderV2(this.getPath(), this.qModel);
  }
}
