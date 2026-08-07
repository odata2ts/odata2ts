import { ODataHttpClient } from "@odata2ts/http-client-api";
import { CollectionQueryBuilderV2, createQueryBuilderV2, ModelQueryBuilderV2 } from "@odata2ts/odata-query-builder";
import { QueryObjectModel } from "@odata2ts/odata-query-objects";
import { ODataServiceOptionsInternalV2 } from "../ODataServiceOptions";
import { ServiceStateHelper } from "../ServiceStateHelper";

export class ServiceStateHelperV2<Q extends QueryObjectModel, AsV4 extends boolean = false> extends ServiceStateHelper {
  /**
   * Whether every response of this service is reshaped as V4 - see {@link ODataServiceOptionsInternalV2}.
   *
   * Kept as its own field rather than widening the inherited (V4-shaped) {@link ServiceStateHelper.options},
   * since `v2ResponseAsV4` has no place in that type.
   */
  private readonly asV4: AsV4;

  public constructor(
    client: ODataHttpClient,
    basePath: string,
    name: string,
    public qModel: Q,
    options?: ODataServiceOptionsInternalV2<AsV4>,
  ) {
    super(client, basePath, name, options);
    this.asV4 = !!options?.v2ResponseAsV4 as AsV4;
  }

  public isAsV4(): AsV4 {
    return this.asV4;
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
