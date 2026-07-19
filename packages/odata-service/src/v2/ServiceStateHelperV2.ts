import { ODataHttpClient } from "@odata2ts/http-client-api";
import { CollectionQueryBuilderV2, createQueryBuilderV2, ModelQueryBuilderV2 } from "@odata2ts/odata-query-builder";
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
    queryFn?: (builder: CollectionQueryBuilderV2<Q>, qObject: Q) => void,
    path = this.path,
  ): CollectionQueryBuilderV2<Q> => {
    const builder = createQueryBuilderV2(path, this.qModel, { unencoded: this.isUrlNotEncoded() });
    if (queryFn) {
      queryFn(builder, this.qModel);
    }

    return builder;
  };

  public createModelQueryBuilder = (
    queryFn?: (builder: ModelQueryBuilderV2<Q>, qObject: Q) => void,
    path = this.path,
  ): ModelQueryBuilderV2<Q> => {
    const builder = createQueryBuilderV2(path, this.qModel, { unencoded: this.isUrlNotEncoded() });
    if (queryFn) {
      queryFn(builder, this.qModel);
    }

    return builder;
  };
}
