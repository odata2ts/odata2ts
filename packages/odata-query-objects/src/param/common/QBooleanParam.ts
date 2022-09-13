import { QParam, UrlParamValueFormatter, UrlParamValueParser } from "../../internal";
import { getParamValue, parseParamValue } from "../UrlParamHelper";

export const getUrlConformValue: UrlParamValueFormatter<boolean> = (value) => {
  return getParamValue(value);
};

export const parseValueFromUrl: UrlParamValueParser<boolean> = (urlConformValue) => {
  const value = parseParamValue(urlConformValue);
  return typeof value !== "string" ? value : value === "true" ? true : value === "false" ? false : undefined;
};

export class QBooleanParam extends QParam<boolean> {
  getUrlConformValue = getUrlConformValue;
  parseValueFromUrl = parseValueFromUrl;
}
