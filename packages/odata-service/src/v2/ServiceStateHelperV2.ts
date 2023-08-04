import { ODataHttpClient } from "@odata2ts/http-client-api";
import { ODataQueryBuilderV2, createQueryBuilderV2 } from "@odata2ts/odata-query-builder";
import { QComplexParam, QueryObject } from "@odata2ts/odata-query-objects";

import { ServiceStateHelper } from "../ServiceStateHelper";

export class ServiceStateHelperV2<T, Q extends QueryObject> extends ServiceStateHelper<T> {
  public readonly qResponseType: QComplexParam<any, Q>;

  public constructor(client: ODataHttpClient, basePath: string, name: string, public qModel: Q) {
    super(client, basePath, name);
    this.qResponseType = new QComplexParam("NONE", qModel);
  }

  public applyQueryBuilder = (queryFn?: (builder: ODataQueryBuilderV2<Q>, qObject: Q) => void): string => {
    if (queryFn) {
      const builder = createQueryBuilderV2(this.path, this.qModel);
      queryFn(builder, this.qModel);
      return builder.build();
    }

    return this.path;
  };
}
