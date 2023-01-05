import { ODataQueryBuilderV2, createQueryBuilderV2 } from "@odata2ts/odata-query-builder";
import { QueryObject } from "@odata2ts/odata-query-objects";

import { OperationBaseService } from "../OperationBaseService";

export class ServiceBaseV2<T, Q extends QueryObject> extends OperationBaseService<Q, ODataQueryBuilderV2<Q>> {
  protected createBuilder(): ODataQueryBuilderV2<Q> {
    return createQueryBuilderV2(this.getPath(), this.qModel);
  }
}
