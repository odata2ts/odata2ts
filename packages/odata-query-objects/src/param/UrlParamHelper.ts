import { ConverterOptions, ParamValueModel } from "@odata2ts/converter-api";
import {
  CollectionFilterFunctions,
  DateTimeFilterFunctions,
  NumberFilterFunctions,
  NumberFilterOperators,
  StandardFilterOperators,
  StringFilterFunctions,
} from "../odata/ODataModel.js";
import { QPathModel } from "../path/QPathModel";
import { QFilterExpression } from "../QFilterExpression";
import { UrlExpressionValueModel, UrlValueModel } from "./UrlParamModel";

/**
 * Handed to a converter whenever the value it converts belongs into a URL rather than into a
 * request or response body. Some conversions differ between the two - `Edm.DateTime` for example
 * is written as `/Date(<ticks>)/` in a V2 body, but never in a URL.
 *
 * Every place building a URL value has to pass this along: paths (`$filter`, `$orderby`) as well
 * as params (entity keys, function parameters). Action parameters are exempt on purpose, they
 * travel in the body.
 */
export const URL_CONVERSION_OPTIONS: ConverterOptions = { urlConversion: true };

function parseNullValue(value: string | undefined): string | null | undefined {
  return value === "null" ? null : value;
}

export function formatLiteralParam(value: ParamValueModel<UrlExpressionValueModel>): UrlValueModel {
  if (value === null) {
    return "null";
  }
  if (value === undefined) {
    return undefined;
  }
  return formatLiteral(value);
}

export function formatLiteral(value: UrlExpressionValueModel): string {
  return String(value);
}

export function parseLiteral(value: UrlValueModel): ParamValueModel<string> {
  return parseNullValue(value);
}

export function formatParamWithTypePrefix(typePrefix: string, value: ParamValueModel<UrlExpressionValueModel>) {
  if (value === null) {
    return "null";
  }
  if (value === undefined) {
    return undefined;
  }
  return formatWithTypePrefix(typePrefix, value);
}

export function formatWithTypePrefix(typePrefix: string, value: UrlExpressionValueModel): string {
  return `${typePrefix}'${value}'`;
}

export function parseWithTypePrefix(typePrefix: string, value: UrlValueModel) {
  const cleanedValue = parseNullValue(value);
  if (typeof cleanedValue === "string") {
    // we throw an error here if value doesn't conform to pattern
    if (!cleanedValue.startsWith(`${typePrefix}'`) || !cleanedValue.endsWith("'")) {
      throw new Error(`Type prefix "${typePrefix}" was expected, but not found in value: ${cleanedValue}`);
    }
    return cleanedValue.substring(typePrefix.length + 1, cleanedValue.length - 1);
  }
  return cleanedValue;
}

export function formatParamWithTypeSuffix(typeSuffix: string, value: ParamValueModel<UrlExpressionValueModel>) {
  if (value === null) {
    return "null";
  }
  if (value === undefined) {
    return undefined;
  }
  return formatWithTypeSuffix(typeSuffix, value);
}

export function formatWithTypeSuffix(typeSuffix: string, value: UrlExpressionValueModel): string {
  return `${value}${typeSuffix}`;
}

export function parseWithTypeSuffix(typeSuffix: string, value: UrlValueModel): ParamValueModel<string> {
  const cleanedValue = parseNullValue(value);
  // lenient: allow the type suffix to be left out
  if (typeof cleanedValue === "string" && cleanedValue.endsWith(typeSuffix)) {
    return cleanedValue.substring(0, cleanedValue.length - typeSuffix.length);
  }
  return cleanedValue;
}

export function formatParamWithQuotes(value: ParamValueModel<UrlExpressionValueModel>): UrlValueModel {
  if (value === null) {
    return "null";
  }
  if (value === undefined) {
    return undefined;
  }
  return formatWithQuotes(value);
}

export function formatWithQuotes(value: UrlExpressionValueModel): string {
  return `'${value}'`;
}

/**
 * Parses a value whose literal form follows its type rather than a fixed spelling: a quoted string, or a
 * bare literal for anything else.
 *
 * This is what an enumeration a service never declared needs. Its members are symbolic names, so only the
 * value behind a name reaches the URL - and whether that value is written `'Available'` or `1` is decided
 * by the annotated property's type, which the URL itself still reveals.
 */
export function parseLiteralOrQuoted(value: UrlValueModel): ParamValueModel<string | number> {
  const cleanedValue = parseNullValue(value);
  if (typeof cleanedValue !== "string") {
    return cleanedValue;
  }
  if (cleanedValue.startsWith("'") && cleanedValue.endsWith("'")) {
    return cleanedValue.substring(1, cleanedValue.length - 1);
  }
  const asNumber = Number(cleanedValue);
  return cleanedValue.trim() === "" || Number.isNaN(asNumber) ? cleanedValue : asNumber;
}

/**
 * Counterpart of {@link parseLiteralOrQuoted}: quotes a string, leaves any other value bare.
 */
export function formatLiteralOrQuoted(value: ParamValueModel<UrlExpressionValueModel>): UrlValueModel {
  return typeof value === "string" ? formatParamWithQuotes(value) : formatLiteralParam(value);
}

export function parseWithQuotes(value: UrlValueModel) {
  const cleanedValue = parseNullValue(value);
  if (typeof cleanedValue === "string") {
    // we throw an error here if value doesn't conform to pattern
    if (!cleanedValue.startsWith("'") || !cleanedValue.endsWith("'")) {
      throw new Error(`Expected single quotes when parsing value: ${value}`);
    }

    return cleanedValue.substring(1, cleanedValue.length - 1);
  }
  return cleanedValue;
}

export function isPathValue(value: QPathModel | any): value is QPathModel {
  return typeof value === "object" && typeof value?.getPath === "function";
}

export function buildOperatorExpression(
  path: string,
  operator: StandardFilterOperators | NumberFilterOperators,
  value: string,
) {
  return `${path} ${operator} ${value}`;
}

export function buildFunctionExpression(
  functionName: CollectionFilterFunctions | StringFilterFunctions | NumberFilterFunctions | DateTimeFilterFunctions,
  ...params: Array<string>
) {
  return `${functionName}(${params.join(",")})`;
}

export function buildQFilterOperation(
  path: string,
  operator: StandardFilterOperators | NumberFilterOperators,
  value: string,
) {
  return new QFilterExpression(buildOperatorExpression(path, operator, value));
}
