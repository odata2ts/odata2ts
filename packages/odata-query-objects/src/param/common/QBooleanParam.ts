import { QParam, UrlParamValueFormatter, UrlParamValueParser } from "../../internal";
import { getParamValue, parseParamValue } from "../UrlParamHelper";

export const getUrlConformValue: UrlParamValueFormatter<boolean> = (value) => {
  return getParamValue(value);
};

export const parseValueFromUrl: UrlParamValueParser<boolean> = (urlConformValue) => {
  const value = parseParamValue(urlConformValue);
  return typeof value !== "string" ? value : value === "true" ? true : value === "false" ? false : undefined;
};

export class QBooleanParam<ConvertedType = boolean> extends QParam<boolean, ConvertedType> {
  getUrlConformValue = getUrlConformValue;
  parseValueFromUrl = parseValueFromUrl;
}
