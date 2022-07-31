import { InlineUrlProps, EntityKeySpec } from "../EntityModel";
import { ParsedKey } from "../ServiceModel";

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
export const compileId = (
  path: string,
  keySpec: EntityKeySpec,
  values: string | number | { [key: string]: any }
): string => {
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

    collector[ks.odataName] = { isLiteral: ks.isLiteral, value, typePrefix: ks.typePrefix };
    return collector;
  }, {} as InlineUrlProps);

  return compileFunctionPathV4(path, undefined, params);
};

const compileSingleParamPath = (path: string, isLiteral: boolean, value: string | number): string => {
  return `${path || ""}(${getValue(isLiteral, value)})`;
};

const getValue = (isLiteral: boolean, value: any, typePrefix?: string): string => {
  if (typePrefix?.trim().length) {
    return typePrefix + compileLiteralValue(value);
  }
  return isLiteral ? compileLiteralValue(value) : compileQuotedValue(value);
};

export const parseId = <T>(id: string, keySpec: EntityKeySpec): ParsedKey<T> => {
  if (!id?.trim()) {
    throw new Error("parseId failed: Irregular id passed!");
  }

  let path = id.replace(/(^[^(]+)\(.*/, "$1");
  if (path === id) {
    path = "";
  }
  let keys = id.replace(/.*\(([^)]+)\)/, "$1").split(",");
  if (keys.length === 1 && keys[0] === id) {
    keys = [];
  }

  let result: Record<string, unknown> = {};

  // handle short form => myEntity(123)
  if (keySpec.length === 1 && keys.length === 1 && keys[0].indexOf("=") === -1) {
    const key = keySpec[0].odataName;
    result[key] = parseValue(key, keys[0], keySpec);
  }
  // complex / explicit form => myEntity(id=123[,...])
  else if (keys.length) {
    result = keys.reduce((coll, cur) => {
      const [key, value] = cur.split("=");

      coll[key] = parseValue(key, value, keySpec);
      return coll;
    }, result);
  }

  if (keys.length !== keySpec.length) {
    throw new Error("ParseId failed: given keys do not comply with key specification!");
  }

  return {
    path,
    // @ts-ignore => too much magic especially regarding poor man's conversion logic
    keys: result,
  };
};

function parseValue(key: string, value: string, keySpec: EntityKeySpec) {
  if (!key || !value) {
    throw new Error(`ParseId failed: Key and value must be specified!`);
  }

  const keyFromSpec = keySpec.find((ks) => ks.odataName === key);
  if (!keyFromSpec) {
    throw new Error(`ParseId failed: Key "${key}" is not part of the key spec!`);
  }

  const { typePrefix, type, isLiteral } = keyFromSpec;

  // clean from typePrefix (v2 only) and from quoted values
  const cleanedValue = typePrefix
    ? value.replace(new RegExp(`^${typePrefix}'([^']*)'`), "$1")
    : !isLiteral
    ? value.replace(/'([^']*)'/, "$1")
    : value;

  // poor man's conversion
  let convertedValue: string | number | boolean;
  if (type === "boolean") {
    if (cleanedValue === "true") {
      convertedValue = true;
    } else if (cleanedValue === "false") {
      convertedValue = false;
    } else {
      throw new Error(
        `ParseId failed: Invalid value for boolean attribute "${key}"! Only the literals "true" or "false" are valid.`
      );
    }
  } else if (type === "number") {
    convertedValue = Number(cleanedValue);
  } else if (!cleanedValue) {
    throw new Error(`ParseId failed: Key and value must be specified!`);
  } else {
    convertedValue = cleanedValue;
  }

  return convertedValue;
}

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
export const compileFunctionPathV4 = (path: string, name?: string, params?: InlineUrlProps): string => {
  const actionPath = compileActionPath(path, name);
  return `${actionPath}(${params ? compileParams(params) : ""})`;
};

export const compileFunctionPathV2 = (path: string, name?: string, params?: InlineUrlProps): string => {
  if (params && typeof params !== "object") {
    throw Error("Only object types are valid for compileParams!");
  }

  const actionPath = compileActionPath(path, name);
  const queryString = !params
    ? ""
    : "?" +
      Object.entries(params)
        .map(([key, { value, isLiteral }]) => {
          // TODO: "null" for optional params via config or does this work for every OData provider?
          const val = value === undefined || value === null ? "null" : getValue(isLiteral, value);
          return encodeURIComponent(key) + "=" + encodeURIComponent(val);
        })
        .join("&");
  return actionPath + queryString;
};

const compileParams = (id: InlineUrlProps) => {
  if (typeof id !== "object") {
    throw Error("Only object types are valid for compileParams!");
  }
  return Object.entries(id)
    .map(([key, { value, isLiteral, typePrefix }]) => {
      // TODO: "null" for optional params via config or does this work for every OData provider?
      const val = value === undefined || value === null ? "null" : getValue(isLiteral, value, typePrefix);
      return key + "=" + val;
    })
    .join(",");
};

/**
 * Constructs an url path suitable for OData actions.
 *
 * @param path required path element; minimum: name of the action
 * @param actionName if left out the path must contain the action name
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
