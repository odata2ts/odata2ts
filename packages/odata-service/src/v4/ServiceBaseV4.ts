import { ODataHttpClient, ODataHttpClientConfig } from "@odata2ts/http-client-api";
import { ODataQueryBuilderV4, createQueryBuilderV4 } from "@odata2ts/odata-query-builder";
import { QueryObject } from "@odata2ts/odata-query-objects";

import { OperationBaseService } from "../OperationBaseService";

export class ServiceBaseV4<T, Q extends QueryObject> extends OperationBaseService<Q, ODataQueryBuilderV4<Q>> {
  public constructor(
    protected client: ODataHttpClient,
    protected basePath: string,
    protected name: string,
    protected qModel: Q,
    protected bigNumbersAsString: boolean = false
  ) {
    super(client, basePath, name, qModel);
    client.retrieveBigNumbersAsString(bigNumbersAsString);
  }

  protected createBuilder(): ODataQueryBuilderV4<Q> {
    return createQueryBuilderV4(this.getPath(), this.qModel);
  }
}
