import { HttpResponseModel } from "@odata2ts/http-client-api";

import { QParamModel } from "../param/QParamModel";
import { OperationReturnType, emptyOperationReturnType } from "./OperationReturnType.js";

type FunctionParams = Record<string, string>;
type FilteredParamModel = [string, string];

// const REGEXP_PATH = /(^[^(]+)\(.*/;
const REGEXP_PARAMS = /.*\(([^)]+)\)/;
const REGEXP_V2_PARAMS = /.*\?(.+)/;

const SINGLE_VALUE_TYPES = ["string", "number", "boolean"];

function compileUrlParams(params: FunctionParams | undefined, notEncoded: boolean = false) {
  if (!params || !Object.keys(params).length) {
    return "()";
  }
  const queryParams: string[] = [];
  const pathParams = Object.entries(params).map(([key, value]) => {
    const isComplex = value.startsWith("{") || value.startsWith("[");
    const [safeKey, safeValue] = notEncoded ? [key, value] : [encodeURIComponent(key), encodeURIComponent(value)];
    if (isComplex) {
      queryParams.push(`@${safeKey}=${safeValue}`);
      return `${safeKey}=@${safeKey}`;
    }
    return `${safeKey}=${safeValue}`;
  });

  return `(${pathParams.join(",")})` + (queryParams.length > 0 ? `?${queryParams.join("&")}` : "");
}

function compileQueryParams(params: FunctionParams | undefined, notEncoded: boolean = false) {
  return !params || !Object.keys(params).length
    ? ""
    : "?" +
        Object.entries(params)
          .map(([key, value]) => {
            return notEncoded ? key + "=" + value : encodeURIComponent(key) + "=" + encodeURIComponent(value);
          })
          .join("&");
}

/**
 * Base class for handling an OData function (v2 and V4).
 *
 * This includes handling of entity id paths (same format as V4 functions).
 */
export abstract class QFunction<ParamModel = undefined> {
  public constructor(
    protected name: string,
    protected qReturnType: OperationReturnType<any> = emptyOperationReturnType,
    protected config: { v2Mode?: boolean } = {}
  ) {}

  public abstract getParams(): Array<QParamModel<any, any>> | Array<Array<QParamModel<any, any>>>;

  private getParamSets(): Array<Array<QParamModel<any, any>>> {
    const params = this.getParams();
    if (params.length) {
      const elemZero = params[0];
      if (!Array.isArray(elemZero)) {
        return [params as Array<QParamModel<any, any>>];
      }
    }
    return params as Array<Array<QParamModel<any, any>>>;
  }

  public getName(): string {
    return this.name;
  }

  public isV2(): boolean {
    return !!this.config.v2Mode;
  }

  public buildUrl(params?: ParamModel, notEncoded = false): string {
    let paramsString: string;

    // short form of id: just primitive value for single key entities
    if (SINGLE_VALUE_TYPES.includes(typeof params)) {
      const qParam = this.findSingleParam();
      if (!qParam) {
        throw new Error("Only one primitive value was provided, but the function requires multiple parameters!");
      }
      const singleParam = qParam.formatUrlValue(params) || "";
      paramsString = `(${notEncoded ? singleParam : encodeURIComponent(singleParam)})`;
    }
    // complex form or undefined
    else {
      const fParams = this.formatParams(params);
      paramsString = this.isV2() ? compileQueryParams(fParams, notEncoded) : compileUrlParams(fParams, notEncoded);
    }

    return this.name + paramsString;
  }

  private formatParams(params?: ParamModel): FunctionParams | undefined {
    if (!params) {
      return undefined;
    }

    const qParams = this.findBestMatchingParamSet(Object.keys(params), true);
    if (!qParams.length) {
      return undefined;
    }

    return Object.entries<any>(params)
      .map(([key, value]) => {
        const qParam = qParams.find((q) => q.getMappedName() === key);
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

  public parseUrl(url: string, notDecoded = false): ParamModel {
    const paramSets = this.getParamSets();
    if (!paramSets?.length) {
      return undefined!;
    }

    // const pathMatcher = url.match(REGEXP_PATH);
    // const path = pathMatcher?.length === 2 ? pathMatcher[1] : undefined;
    const paramMatcher = url.match(this.isV2() ? REGEXP_V2_PARAMS : REGEXP_PARAMS);
    const rawParams = paramMatcher?.length === 2 ? paramMatcher[1].split(this.isV2() ? "&" : ",") : [];

    if (!rawParams.length) {
      throw new Error(`Parsing url "${url}" did not yield any params!`);
    }

    // handle short form => myEntity(123)
    if (rawParams.length === 1 && rawParams[0].indexOf("=") === -1) {
      const qParam = this.findSingleParam();
      if (!qParam) {
        throw new Error("Only one primitive value was provided, but the function requires multiple parameters!");
      }
      return qParam.parseUrlValue(notDecoded ? rawParams[0] : decodeURIComponent(rawParams[0]));
    }

    // regular form
    const params = rawParams.reduce((model, param) => {
      const keyAndValue = param.split("=");
      if (keyAndValue.length !== 2) {
        throw new Error(`Failed to parse function params: Key and value must be specified!`);
      }

      const key = notDecoded ? keyAndValue[0] : decodeURIComponent(keyAndValue[0]);
      const value = notDecoded ? keyAndValue[1] : decodeURIComponent(keyAndValue[1]);

      model[key] = value;
      return model;
    }, {} as Record<string, string>);

    const qParams = this.findBestMatchingParamSet(Object.keys(params), false);
    return Object.entries(params).reduce((model, [key, value]) => {
      const qParam = qParams.find((q) => q.getName() === key);

      if (!qParam) {
        throw new Error(
          `Failed to parse function params: Param "${key}" is not part of this function's method signature!`
        );
      }

      model[qParam.getMappedName() as keyof ParamModel] = qParam.parseUrlValue(value);
      return model;
    }, {} as ParamModel);
  }

  public convertResponse(response: HttpResponseModel<any>) {
    return this.isV2() ? this.qReturnType.convertResponseV2(response) : this.qReturnType.convertResponse(response);
  }

  private findSingleParam() {
    const result = this.getParamSets().find((pSet) => pSet.length === 1);

    return result ? result[0] : undefined;
  }

  private findBestMatchingParamSet(paramKeys: Array<string>, findByMappedName: boolean): Array<QParamModel<any, any>> {
    const paramSets = this.getParamSets();
    if (!paramKeys.length || !paramSets.length) {
      return [];
    } else if (paramSets.length === 1) {
      return paramSets[0];
    }

    return (
      this.getParamSets().find((pSet) => {
        const qParamKeys = pSet.map((p) => (findByMappedName ? p.getMappedName() : p.getName()));
        return !paramKeys.find((pKey) => !qParamKeys.includes(pKey));
      }) ?? []
    );
  }
}
