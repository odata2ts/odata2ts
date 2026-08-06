import { ODataHttpClient } from "@odata2ts/http-client-api";
import { ODataModelPayloadFor, ODataVersionV4 } from "@odata2ts/odata-core";
import { CollectionQueryBuilderV4, createQueryBuilderV4, ModelQueryBuilderV4 } from "@odata2ts/odata-query-builder";
import { QueryObjectModel } from "@odata2ts/odata-query-objects";
import { ODataServiceOptionsInternal } from "../ODataServiceOptions";
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
  ) {
    super(client, basePath, name, options);
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
