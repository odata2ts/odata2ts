import { ODataHttpClient } from "@odata2ts/http-client-api";
import { CollectionQueryBuilderV2, createQueryBuilderV2, ModelQueryBuilderV2 } from "@odata2ts/odata-query-builder";
import { QueryObjectModel } from "@odata2ts/odata-query-objects";
import { getBodyETagV2, getBodyETagV4 } from "../ETagExtraction.js";
import { ODataServiceOptionsInternalV2 } from "../ODataServiceOptions";
import { ConcurrencyOptions } from "../request/RequestCmd.js";
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

  /**
   * The ETag this response states for the addressed entity.
   *
   * V2 puts it in `__metadata.etag` and wraps the entity in a `d` envelope. A service reshaping its
   * responses as V4 has had both undone by the time a harvest runs, so that one reads the V4 control
   * information instead - which is why the reader is chosen here rather than inside a single helper
   * trying every spelling.
   */
  private etagOf(data: any): string | undefined {
    return this.asV4 ? getBodyETagV4(data) : getBodyETagV2(data?.d);
  }

  /**
   * The concurrency options for a command addressing this very entity - an arrow-function property, since
   * the services destructure it off `this.__base`.
   */
  public getConcurrencyOptions = (): ConcurrencyOptions => {
    return {
      key: this.path,
      controlled: this.isConcurrencyControlled(),
      harvest: (data: any) => {
        const etag = this.etagOf(data);
        return etag ? [[this.path, etag] as [string, string]] : [];
      },
    };
  };

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
