import { ODataHttpClient } from "@odata2ts/http-client-api";
import { createQueryBuilderV2, ODataQueryBuilderV2 } from "@odata2ts/odata-query-builder";
import { QComplexParam, QueryObject } from "@odata2ts/odata-query-objects";
import { ServiceStateHelper } from "../ServiceStateHelper.js";

export class ServiceStateHelperV2<
  in out ClientType extends ODataHttpClient,
  Q extends QueryObject,
> extends ServiceStateHelper<ClientType> {
  public readonly qResponseType: QComplexParam<any, Q>;

  public constructor(
    client: ClientType,
    basePath: string,
    name: string,
    public qModel: Q,
  ) {
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
