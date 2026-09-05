import { ODataHttpClient } from "@odata2ts/http-client-api";
import { ODataModelPayloadFor, ODataVersionV4 } from "@odata2ts/odata-core";
import { CollectionQueryBuilderV4, createQueryBuilderV4, ModelQueryBuilderV4 } from "@odata2ts/odata-query-builder";
import { QueryObjectModel } from "@odata2ts/odata-query-objects";
import { CacheKeyState } from "../cacheKey/index.js";
import { getBodyETagV4 } from "../ETagExtraction.js";
import { ODataServiceOptionsInternal } from "../ODataServiceOptions";
import { ConcurrencyOptions } from "../request/RequestCmd.js";
import { ServiceStateHelper } from "../ServiceStateHelper.js";

export interface SubtypeOptions {
  withCastPathSegment?: boolean;
  withTypeControlInfo?: boolean;
}

export class ServiceStateHelperV4<
  Q extends QueryObjectModel,
  V extends ODataVersionV4 = "4.0",
> extends ServiceStateHelper<V> {
  public constructor(
    client: ODataHttpClient,
    basePath: string,
    name: string,
    public qModel: Q,
    options?: ODataServiceOptionsInternal<V>,
    cacheKeyState?: CacheKeyState,
  ) {
    super(client, basePath, name, options, cacheKeyState);
  }

  public createQueryBuilder = (
    queryFn?: (builder: CollectionQueryBuilderV4<Q>, qObject: Q) => void,
    path = this.path,
  ): CollectionQueryBuilderV4<Q> => {
    const builder = createQueryBuilderV4(path, this.qModel, { unencoded: this.isUrlNotEncoded() });
    if (queryFn) {
      queryFn(builder, this.qModel);
    }

    return builder;
  };

  public createModelQueryBuilder = (
    queryFn?: (builder: ModelQueryBuilderV4<Q>, qObject: Q) => void,
    path = this.path,
  ): ModelQueryBuilderV4<Q> => {
    const builder = createQueryBuilderV4(path, this.qModel, { unencoded: this.isUrlNotEncoded() });
    if (queryFn) {
      queryFn(builder, this.qModel);
    }

    return builder;
  };

  /**
   * The concurrency options for a command addressing this very entity.
   *
   * An arrow-function property rather than a method, like everything else on the state helper the
   * services reach for: they destructure it off `this.__base`, and a method would lose its `this` the
   * moment it is pulled off the object.
   *
   * Reading the body's ETag goes through {@link getBodyETagV4}, which knows both the 4.0 and the 4.01
   * spelling - never hard-code either here.
   */
  public getConcurrencyOptions = (): ConcurrencyOptions => {
    return {
      key: this.path,
      controlled: this.isConcurrencyControlled(),
      harvest: (data: any) => {
        const etag = getBodyETagV4(data);
        return etag ? [[this.path, etag] as [string, string]] : [];
      },
    };
  };

  public evaluateSubtypeOptions(options: SubtypeOptions | undefined) {
    const isSubtype = !!this.options.subtype;
    const dontUseCastPathSegment = isSubtype && !options?.withCastPathSegment;
    return {
      dontUseCastPathSegment,
      useTypeCi:
        (isSubtype && dontUseCastPathSegment && options?.withTypeControlInfo !== false) ||
        (isSubtype && options?.withTypeControlInfo),
    };
  }

  public addTypeControlInfo<T>(model: ODataModelPayloadFor<V, T>): ODataModelPayloadFor<V, T> {
    // control information supplied by the user wins, in either spelling: adding ours on top would
    // produce a payload carrying both forms, which is not valid
    if ("@odata.type" in model || "@type" in model) {
      return model;
    }

    // 4.01 and greater use the short form of the control information
    return this.options.odataVersionV4 === "4.01"
      ? { "@type": `#${this.name}`, ...model }
      : { "@odata.type": `#${this.name}`, ...model };
  }
}
