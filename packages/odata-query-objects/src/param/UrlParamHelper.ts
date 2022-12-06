import { ParamValueModel } from "@odata2ts/converter-api";

import {
  CollectionFilterFunctions,
  DateTimeFilterFunctions,
  NumberFilterFunctions,
  NumberFilterOperators,
  StandardFilterOperators,
  StringFilterFunctions,
} from "../odata/ODataModel";
import { QPathModel } from "../path/QPathModel";
import { QFilterExpression } from "../QFilterExpression";
import { UrlExpressionValueModel, UrlValueModel } from "./UrlParamModel";

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
  value: string
) {
  return `${path} ${operator} ${value}`;
}

export function buildFunctionExpression(
  functionName: CollectionFilterFunctions | StringFilterFunctions | NumberFilterFunctions | DateTimeFilterFunctions,
  param1: string,
  param2?: string
) {
  return `${functionName}(${param1}${param2 ? `,${param2}` : ""})`;
}

export function buildQFilterOperation(
  path: string,
  operator: StandardFilterOperators | NumberFilterOperators,
  value: string
) {
  return new QFilterExpression(buildOperatorExpression(path, operator, value));
}
