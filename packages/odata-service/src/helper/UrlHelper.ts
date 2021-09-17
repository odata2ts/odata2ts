import { InlineUrlProps, KeySpec } from "./../EntityModel";

/**
 * Constructs an url path for an entity with the given values as key props.
 * The passed value can either be simple, in the case of an id,
 * or complex in the case of a composite id.
 *
 * Passed values are checked against the keySpec to only allow valid values.
 * The function also checks that all required keys are specified.
 *
 * @param path required path element
 * @param keySpec specification of keys
 * @param values either a primitive number or string or an dedicated object with name-value-pairs.
 * @returns url path
 */
export const compileId = (path: string, keySpec: KeySpec, values: string | number | { [key: string]: any }): string => {
  if (typeof values === "string" || typeof values === "number") {
    if (Object.keys(keySpec).length !== 1) {
      throw Error("Only primitive value for id provided, but complex key spec is required!");
    }
    return compileSingleParamPath(path, Object.values(keySpec)[0].isLiteral, values);
  }
  const params = keySpec.reduce((collector, ks) => {
    const value = values[ks.odataName];
    if (value === undefined) {
      throw Error(`Key [${ks.odataName}] not mapped in provided values!`);
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
      // TODO: "null" for optional params via config or does this work for every OData provider?
      const val = value === undefined || value === null ? "null" : getValue(isLiteral, value);
      return key + "=" + val;
    })
    .join(",");
};

/**
 * Constructs an url path suitable for OData actions.
 *
 * @param path required path element; minimum: name of the action
 * @param name action name; if left out the path must contain the action name
 * @returns url path
 */
export const compileActionPath = (path: string, actionName?: string) => {
  if (!path || !path.trim()) {
    throw Error("Path must be provided; at least the function name!");
  }
  return `${path}${actionName ? "/" + actionName : ""}`;
};

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
