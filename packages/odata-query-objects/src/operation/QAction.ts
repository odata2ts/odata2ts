import { HttpResponseModel } from "@odata2ts/http-client-api";

import { QParamModel } from "../param/QParamModel";
import { OperationReturnType, emptyOperationReturnType } from "./OperationReturnType";

type ActionParams = Record<string, any>;
type FilteredParamModel = [string, any];

export abstract class QAction<ParamModel = undefined> {
  public constructor(
    protected name: string,
    protected qReturnType: OperationReturnType<any> = emptyOperationReturnType
  ) {}

  public abstract getParams(): Array<QParamModel<any, any>> | undefined;

  public getName(): string {
    return this.name;
  }

  public buildUrl() {
    return this.name;
  }

  public convertUserParams(params: ParamModel): ActionParams | undefined {
    const qParams = this.getParams();

    if (!params || !qParams) {
      return undefined;
    }

    return Object.entries<any>(params)
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
  }

  public convertODataParams(params: ParamModel extends undefined ? undefined : ActionParams): ParamModel | undefined {
    const qParams = this.getParams();

    if (!params || !qParams) {
      return undefined;
    }

    return Object.entries<any>(params)
      .map(([key, value]) => {
        const qParam = qParams.find((q) => q.getName() === key);
        if (!qParam) {
          throw new Error(`Unknown parameter "${key}"!`);
        }

        // maps the name and converts the value
        return [qParam.getMappedName(), qParam.convertFrom(value)];
      })
      .filter((p): p is FilteredParamModel => p[1] !== undefined)
      .reduce((collector, [key, value]) => {
        collector[key as keyof ParamModel] = value;
        return collector;
      }, {} as ParamModel);
  }

  public convertResponse(response: HttpResponseModel<any>) {
    return this.qReturnType.convertResponse(response);
  }
}
