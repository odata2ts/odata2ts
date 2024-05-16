import { ODataHttpClient } from "@odata2ts/http-client-api";
import { ODataQueryBuilderV4, createQueryBuilderV4 } from "@odata2ts/odata-query-builder";
import { QComplexParam, QueryObject } from "@odata2ts/odata-query-objects";

import { ServiceStateHelper } from "../ServiceStateHelper";

export class ServiceStateHelperV4<
  in out ClientType extends ODataHttpClient,
  Q extends QueryObject
> extends ServiceStateHelper<ClientType> {
  public readonly qResponseType: QComplexParam<any, Q>;

  public constructor(
    client: ClientType,
    basePath: string,
    name: string,
    public readonly qModel: Q,
    bigNumbersAsString?: boolean
  ) {
    super(client, basePath, name, bigNumbersAsString);
    this.qResponseType = new QComplexParam("NONE", qModel);
  }

  public applyQueryBuilder = (queryFn?: (builder: ODataQueryBuilderV4<Q>, qObject: Q) => void): string => {
    if (queryFn) {
      const builder = createQueryBuilderV4(this.path, this.qModel);
      queryFn(builder, this.qModel);
      return builder.build();
    }

    return this.path;
  };
}
