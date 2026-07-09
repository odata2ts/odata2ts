import { QParamModel } from "../param/QParamModel";
import { FlexibleConversionModel } from "../QueryObjectModel";
import { getResponseDataAdapter, ResponseDataAdapter, ResponseDataConverter, ReturnTypes } from "./ResponseHelper";

type ActionParams = Record<string, any>;
type FilteredParamModel = [string, any];

export abstract class QAction<ParamModel = undefined, ResponseStructure = undefined> {
  public constructor(
    protected name: string,
    protected returnType: ReturnTypes = ReturnTypes.VOID,
    protected responseConverter?: ResponseDataConverter<any, ResponseStructure>,
  ) {}

  public abstract getParams(): Array<QParamModel<any, any>> | undefined;

  public getName(): string {
    return this.name;
  }

  public buildUrl() {
    return this.name;
  }

  public getRequestConverter() {
    const qParams = this.getParams();
    if (!qParams) {
      return undefined;
    }

    return {
      convertTo: (data: FlexibleConversionModel<ParamModel>) => {
        if (!data) {
          return undefined;
        }

        return Object.entries<any>(data)
          .map(([key, value]) => {
            const qParam = qParams.find((q) => q.getMappedName() === key);
            if (!qParam) {
              throw new Error(`Unknown parameter "${key}"!`);
            }

            // maps the name and converts the value
            return [qParam.getName(), qParam.convertTo(value)];
          })
          .filter((p): p is FilteredParamModel => p[1] !== undefined)
          .reduce((collector, [key, value]) => {
            collector[key] = value;
            return collector;
          }, {} as ActionParams);
      },
    };
  }

  public getResponseDataAdapter(): ResponseDataAdapter | undefined {
    return getResponseDataAdapter(this.returnType);
  }

  public getResponseConverter(): ResponseDataConverter | undefined {
    return this.responseConverter;
  }
}
