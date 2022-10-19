import { ParamValueModel } from "@odata2ts/converter-api";

/**
 * Configuration to format an URL param.
 */
export interface UrlParamModel {
  isQuoted?: boolean;
  typePrefix?: string;
  typeSuffix?: string;
}

/**
 * Type of URl parameter value before formatting.
 */
export type UrlExpressionValueModel = number | string | boolean;

/**
 * Type of URL parameter value before parsing.
 */
export type UrlValueModel = string | undefined;

/**
 * Takes a primitive value and formats it appropriate for usage in URLs, taking care of
 * - null values are formatted as "null"
 * - quotes, where appropriate (e.g. string path)
 * - V2: type prefixing, e.g. datetime'2022-12-31T12:59:59'
 * - V2: type suffixing, e.g. 12.333d
 *
 * Useful for function parameter values.
 */
export type UrlParamValueFormatter<Type extends boolean | number | string> = (
  value: ParamValueModel<Type>
) => UrlValueModel;

/**
 * Retrieves the value string from the given URL param value without any quotes, type suffixes or prefixes
 * and then converts it to the specified primitive JS type.
 *
 * Null will only be returned if the passed value equals "null".
 *
 * @param value the url param value as it is used in keys, filter queries or function params
 * @param parsingRegExp the regular expression to use to parse the value
 */
export type UrlParamValueParser<Type extends boolean | number | string> = (
  urlConformValue: UrlValueModel
) => ParamValueModel<Type>;
