import { UrlExpressionValueModel, UrlParamModel } from "./UrlParamModel";

/**
 * Convert a given value to a URL conform parameter value, which can be used in
 * - keys
 * - filter expressions
 * - function params
 *
 * If null is passed, then the result will be "null", since null is a valid data type.
 * If the parameter itself is optional, you can pass undefined to leave out the parameter.
 *
 * @param value
 * @param options by default values are interpreted as literals, i.e. without surrounding single quotes
 */
function getValue(value: number | string | boolean, options: UrlParamModel = {}): string {
  const { isQuoted = false, typePrefix, typeSuffix } = options;

  if (typePrefix) {
    return `${typePrefix}'${value}'`;
  }
  if (typeSuffix) {
    return `${value}${typeSuffix}`;
  }
  return isQuoted ? `'${value}'` : String(value);
}

/**
 * Get value suitable for an expression, e.g. filter expression value.
 *
 * @param value another path, null or a primitive type
 * @param options meta infos about value conversion
 */
export function getExpressionValue(value: UrlExpressionValueModel, options?: UrlParamModel) {
  // an expression might reference another attribute
  if (typeof value === "object" && typeof value?.getPath === "function") {
    return value.getPath();
  }
  // null is a regular value
  if (value === null) {
    return "null";
  }
  return getValue(value as string | number | boolean, options);
}

/**
 * Get value suitable for parameters, e.g. function parameters.
 *
 * @param value null or any primitive type; if undefined consumer is responsible to filter out that parameter
 * @param options meta infos about value conversion
 */
export function getParamValue(
  value: number | string | boolean | null | undefined,
  options?: UrlParamModel
): string | undefined {
  switch (value) {
    // null is a regular value
    case null:
      return "null";
    // undefined should be filtered by consumer
    case undefined:
      return undefined;
    default:
      return getValue(value, options);
  }
}

/**
 * Creates a regular expression to remove single quotes or type prefixes or type suffixes.
 * If all of this is not applicable, thus the value being a simple literal value, undefined will be returned instead
 * of a RegExp.
 *
 * @param config
 */
export function createParsingRegexp(config: UrlParamModel = {}): RegExp | undefined {
  const { isQuoted = false, typePrefix, typeSuffix } = config;

  return typePrefix
    ? new RegExp(`^${typePrefix}'([^']*)'`)
    : typeSuffix
    ? new RegExp(`(.*)${typeSuffix}$`)
    : isQuoted
    ? /'([^']*)'/
    : undefined;
}

/**
 * Retrieves the string value from the given param value without any quotes, type suffixes or prefixes.
 * Obviously no real data type conversion takes place.
 *
 * Note: "Null" might be a valid return value.
 *
 * @param value the url param value as it is used in keys, filter queries or function params
 * @param parsingRegExp the regular expression to use to parse the value
 */
export function parseParamValue(
  value: string | undefined,
  parsingRegExp?: RegExp | undefined
): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (value === "null") {
    return null;
  }

  return parsingRegExp ? value.replace(parsingRegExp, "$1") : value;
}
