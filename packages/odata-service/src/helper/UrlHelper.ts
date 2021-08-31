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

    collector[ks.odataName] = { isLiteral: ks.isLiteral, value };
    return collector;
  }, {} as InlineUrlProps);

  return compileFunctionPath(path, undefined, params);
};

const compileSingleParamPath = (path: string, isLiteral: boolean, value: string | number): string => {
  return `${path || ""}(${getValue(isLiteral, value)})`;
};

const getValue = (isLiteral: boolean, value: any): string => {
  return isLiteral ? compileLiteralValue(value) : compileQuotedValue(value);
};

/**
 * Constructs an url path suitable for OData functions.
 * Parentheses are always added.
 * Parameters are supported.
 *
 * @param path required path element; minimum: name of the function
 * @param name function name; if left out the path must contain the function name
 * @param params parameter map which specifies whether each value is literal or quoted
 * @returns url path
 */
export const compileFunctionPath = (path: string, name?: string, params?: InlineUrlProps): string => {
  const actionPath = compileActionPath(path, name);
  return `${actionPath}(${params ? compileParams(params) : ""})`;
};

const compileParams = (id: InlineUrlProps) => {
  if (typeof id !== "object") {
    throw Error("Only object types are valid for compileParams!");
  }
  return Object.entries(id)
    .map(([key, { value, isLiteral }]) => {
      const val = value === undefined || value === null ? null : getValue(isLiteral, value);
      return key + "=" + val;
    })
    .join(",");
};

export const compileActionPath = (path: string, actionName?: string) => {
  if (!path || !path.trim()) {
    throw Error("Path must be provided; at least the function name!");
  }
  return `${path}${actionName ? "/" + actionName : ""}`;
};

// export const compileBodyParam = (params: InlineUrlProps): string => {
//   const ps = Object.entries(params).map(([name, prop]) => `${name}: ${getValue(prop.isLiteral, prop.value)}}`);
//   return `{ ${ps.join(",")} }`;
// };

/**
 * Returns an appropriate string value for the given value.
 * Performs validity checks on type and valid value.
 *
 * @param value value to print out as string
 * @returns string value
 */
export const compileLiteralValue = (value: string | number | boolean): string => {
  if (typeof value !== "string" && typeof value !== "number" && typeof value !== "boolean") {
    throw Error("Only string, number & boolean types are valid for compileLiteralValue!");
  }
  if (typeof value === "string" && !value.trim().length) {
    throw Error("Empty string given as value: Not allowed!");
  }
  return String(value);
};

/**
 * Returns the value as quoted string, e.g. "test" => "'test'".
 *
 * @param value value to print out as string with single quotes
 * @returns string value
 */
export const compileQuotedValue = (value: string | number | boolean): string => {
  if (typeof value !== "string" && typeof value !== "number" && typeof value !== "boolean") {
    throw Error("Only string, number & boolean types are valid for compileQuotedValue!");
  }
  if (typeof value === "string" && !value.trim().length) {
    throw Error("Empty string given as value: Not allowed!");
  }
  return `'${value}'`;
};
