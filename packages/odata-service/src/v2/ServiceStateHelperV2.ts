import { ODataHttpClient } from "@odata2ts/http-client-api";
import { createQueryBuilderV2, ODataQueryBuilderV2 } from "@odata2ts/odata-query-builder";
import { QComplexParam, QueryObjectModel } from "@odata2ts/odata-query-objects";
import { ODataServiceOptions } from "../ODataServiceOptions";
import { ServiceStateHelper } from "../ServiceStateHelper";

export class ServiceStateHelperV2<
  in out ClientType extends ODataHttpClient,
  Q extends QueryObjectModel,
> extends ServiceStateHelper<ClientType> {
  public constructor(
    client: ClientType,
    basePath: string,
    name: string,
    public qModel: Q,
    options?: ODataServiceOptions,
  ) {
    super(client, basePath, name, options);
  }

  public createQueryBuilder = (
    queryFn?: (builder: ODataQueryBuilderV2<Q>, qObject: Q) => void,
    path = this.path,
  ): ODataQueryBuilderV2<Q> => {
    const builder = createQueryBuilderV2(path, this.qModel, { unencoded: this.isUrlNotEncoded() });
    if (queryFn) {
      queryFn(builder, this.qModel);
    }

    return builder;
  };
}
