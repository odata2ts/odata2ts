import { QParamModel } from "../param/QParamModel";
import { FlexibleConversionModel } from "../QueryObjectModel";
import { ExtractDataTypeFromV4ResponseStructure, MainResponseConverter } from "../response/MainResponseConverter";

type ActionParams = Record<string, any>;
type FilteredParamModel = [string, any];

export abstract class QAction<ParamModel, ResponseStructure = undefined> {
  public constructor(
    protected name: string,
    protected responseConverter?: MainResponseConverter<
      ResponseStructure,
      ExtractDataTypeFromV4ResponseStructure<ResponseStructure>
    >,
  ) {}

  public abstract getParams(): Array<QParamModel<any, any>> | undefined;

  public getName(): string {
    return this.name;
  }

  public buildUrl() {
    return this.name;
  }

  public getRequestConverter(): Pick<QParamModel<any, ParamModel>, "convertTo"> | undefined {
    const qParams = this.getParams();
    if (!qParams) {
      return undefined;
    }

    return {
      convertTo: (data: FlexibleConversionModel<ParamModel>): FlexibleConversionModel<any> => {
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

  public getResponseConverter() {
    return this.responseConverter;
  }
}
