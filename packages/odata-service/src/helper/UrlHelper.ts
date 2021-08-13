import { InlineUrlProps } from "./../EntityModel";

export const compileParameterPath = (basePath: string, path: string, params?: InlineUrlProps): string => {
  return `${basePath}/${path}` + (params ? `(${compileParams(params)})` : "");
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
