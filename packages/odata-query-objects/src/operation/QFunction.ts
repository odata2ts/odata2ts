import { QParam } from "./";
import { compileOperationPath } from "./OperationHelper";

type FunctionParams = Record<string, string>;
type FilteredParamModel = [string, string];

// const REGEXP_PATH = /(^[^(]+)\(.*/;
const REGEXP_PARAMS = /.*\(([^)]+)\)/;
const REGEXP_V2_PARAMS = /.*\?(.+)/;

const SINGLE_VALUE_TYPES = ["string", "number", "boolean"];

function compileUrlParams(params: FunctionParams | undefined) {
  const result =
    !params || !Object.keys(params).length
      ? ""
      : Object.entries(params)
          .map(([key, value]) => {
            return key + "=" + value;
          })
          .join(",");

  return `(${result})`;
}

function compileQueryParams(params: FunctionParams | undefined) {
  return !params || !Object.keys(params).length
    ? ""
    : "?" +
        Object.entries(params)
          .map(([key, value]) => {
            return encodeURIComponent(key) + "=" + encodeURIComponent(value);
          })
          .join("&");
}

/**
 * Base class for handling an OData function (v2 and V4).
 * This includes handling of entity id paths which have exactly the same form.
 */
export abstract class QFunction<ParamModel = undefined> {
  public constructor(protected path: string, protected name: string, protected v2Mode: boolean = false) {}

  public abstract getParams(): Record<string, QParam<any>> | undefined;

  public getPath(): string {
    return this.path;
  }

  public getName(): string {
    return this.name;
  }

  public isV2(): boolean {
    return this.v2Mode;
  }

  protected formatUrl(params: ParamModel): string {
    const qParams = this.getParams();
    let paramsString: string = "";

    // short form of id: just primitive value for single key entities
    if (SINGLE_VALUE_TYPES.includes(typeof params)) {
      const qParamKeys = qParams ? Object.keys(qParams) : [];
      if (!qParams || qParamKeys.length !== 1) {
        throw new Error("Only primitive value for id provided, but complex key spec is required!");
      }
      paramsString = `(${qParams[qParamKeys[0]].formatUrlValue(params) || ""})`;
    }
    // complex form
    else {
      const formatted = this.formatParams(params);
      paramsString = this.isV2() ? compileQueryParams(formatted) : compileUrlParams(formatted);
    }

    return compileOperationPath(this.path, this.name) + paramsString;
  }

  private formatParams(params: ParamModel): FunctionParams | undefined {
    const qParams = this.getParams();

    if (!params || !qParams) {
      return undefined;
    }

    return Object.entries<any>(params)
      .map(([key, value]) => {
        const qParam = qParams[key];
        if (!qParam) {
          throw new Error(`Unknown parameter "${key}"!`);
        }
        return [qParam.getName(), qParam.formatUrlValue(value)];
      })
      .filter((p): p is FilteredParamModel => p[1] !== undefined)
      .reduce((collector, [key, value]) => {
        collector[key] = value;
        return collector;
      }, {} as FunctionParams);
  }

  public parseUrl(url: string): ParamModel {
    const qParams = this.getParams();
    if (!qParams || !Object.keys(qParams).length) {
      return undefined!;
    }

    // const pathMatcher = url.match(REGEXP_PATH);
    // const path = pathMatcher?.length === 2 ? pathMatcher[1] : undefined;
    const paramMatcher = url.match(this.isV2() ? REGEXP_V2_PARAMS : REGEXP_PARAMS);
    const params = paramMatcher?.length === 2 ? paramMatcher[1].split(this.isV2() ? "&" : ",") : [];

    // handle short form => myEntity(123)
    if (Object.keys(qParams).length === 1 && params.length === 1 && params[0].indexOf("=") === -1) {
      const [key, qParam] = Object.entries<QParam<any>>(qParams)[0];
      return {
        [key]: qParam.parseUrlValue(params[0]),
      } as ParamModel;
    }

    // regular form
    return params.reduce((model, param) => {
      const keyAndValue = param.split("=");
      if (keyAndValue.length !== 2) {
        throw new Error(`Failed to parse function params: Key and value must be specified!`);
      }

      const [key, value] = keyAndValue;
      const qParamEntry = Object.entries<QParam<any>>(qParams).find((entry) => entry[1].getName() === key);

      if (!qParamEntry) {
        throw new Error(
          `Failed to parse function params: Param "${key}" is not part of this function's method signature!`
        );
      }

      // @ts-ignore
      model[qParamEntry[0]] = qParamEntry[1].parseUrlValue(value);
      return model;
    }, {} as ParamModel);
  }
}
