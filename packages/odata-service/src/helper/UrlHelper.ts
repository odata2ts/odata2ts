import { InlineUrlProps, KeySpec } from "./../EntityModel";

export const compileId = (path: string, keySpec: KeySpec, values: string | number | { [key: string]: any }): string => {
  if (typeof values === "string" || typeof values === "number") {
    if (Object.keys(keySpec).length !== 1) {
      throw Error("Only primitive value for id provided, but complex key spec is required!");
    }
    return compileSingleParamPath(path, Object.values(keySpec)[0].isLiteral, values);
  }
  const params = keySpec.reduce((collector, ks) => {
    const value = values[ks.name];
    if (value === undefined) {
      throw Error(`Key [ks.name] not mapped in provided values!`);
    }

    collector[ks.name] = { isLiteral: ks.isLiteral, value };
    return collector;
  }, {} as InlineUrlProps);

  return compileParameterPath(path, undefined, params);
};

function getValue(isLiteral: boolean, value: any): string {
  return isLiteral ? value : compileQuotedValue(value);
}

export const compileSingleParamPath = (path: string, isLiteral: boolean, value: string | number) => {
  return `${path || ""}(${getValue(isLiteral, value)})`;
};

export const compileParameterPath = (basePath: string, path?: string, params?: InlineUrlProps): string => {
  return `${basePath}${path ? "/" + path : ""}` + (params ? `(${compileParams(params)})` : "");
};

export const compileBodyParam = (params: InlineUrlProps): string => {
  const ps = Object.entries(params).map(([name, prop]) => `${name}: ${getValue(prop.isLiteral, prop.value)}}`);
  return `{ ${ps.join(",")} }`;
};

export const compileParams = (id: InlineUrlProps) => {
  if (typeof id !== "object") {
    throw Error("Only object types are valid for compileParams!");
  }
  return Object.entries(id)
    .map(([key, value]) => {
      const val = value.isLiteral ? compileLiteralValue(value.value) : compileQuotedValue(value.value);
      return key + "=" + val;
    })
    .join(",");
};

export const compileLiteralValue = (id: string | number): string => {
  if (typeof id !== "string" && typeof id !== "number") {
    throw Error("Only string & number types are valid for compileLiteralId!");
  }
  return String(id);
};

export const compileQuotedValue = (id: string | number) => {
  if (typeof id !== "string" && typeof id !== "number") {
    throw Error("Only string & number types are valid for compileQuotedId!");
  }
  return `'${id}'`;
};
