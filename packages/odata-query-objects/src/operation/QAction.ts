import { QParam } from "../param";

type ActionParams = Record<string, any>;
type FilteredParamModel = [string, any];

export abstract class QAction<ParamModel = undefined> {
  public constructor(protected name: string) {}

  public abstract getParams(): Array<QParam<any>> | undefined;

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

        // maps the name
        // TODO: convert value here via qParam
        return [qParam.getName(), value];
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

        // TODO: value conversion
        return [qParam.getMappedName(), value];
      })
      .filter((p): p is FilteredParamModel => p[1] !== undefined)
      .reduce((collector, [key, value]) => {
        collector[key as keyof ParamModel] = value;
        return collector;
      }, {} as ParamModel);
  }
}
