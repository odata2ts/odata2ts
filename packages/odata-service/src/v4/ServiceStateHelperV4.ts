import { ODataHttpClient } from "@odata2ts/http-client-api";
import { ODataModelPayloadV4 } from "@odata2ts/odata-core";
import { createQueryBuilderV4, ODataQueryBuilderV4 } from "@odata2ts/odata-query-builder";
import { QComplexParam, QueryObjectModel } from "@odata2ts/odata-query-objects";
import { ODataServiceOptionsInternal } from "../ODataServiceOptions";
import { ServiceStateHelper } from "../ServiceStateHelper.js";

export interface SubtypeOptions {
  withCastPathSegment?: boolean;
  withTypeControlInfo?: boolean;
}

export class ServiceStateHelperV4<
  in out ClientType extends ODataHttpClient,
  Q extends QueryObjectModel,
> extends ServiceStateHelper<ClientType> {
  public readonly qResponseType: QComplexParam<any, Q>;

  public constructor(
    client: ClientType,
    basePath: string,
    name: string,
    public readonly qModel: Q,
    options?: ODataServiceOptionsInternal,
  ) {
    super(client, basePath, name, options);
    this.qResponseType = new QComplexParam("NONE", qModel);
  }

  public applyQueryBuilder = (queryFn?: (builder: ODataQueryBuilderV4<Q>, qObject: Q) => void): string => {
    if (queryFn) {
      const builder = createQueryBuilderV4(this.path, this.qModel, { unencoded: this.isUrlNotEncoded() });
      queryFn(builder, this.qModel);
      return builder.build();
    }

    return this.path;
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

  public addTypeControlInfo<T>(model: ODataModelPayloadV4<T>) {
    return {
      "@odata.type": `#${this.name}`,
      ...model,
    };
  }
}
