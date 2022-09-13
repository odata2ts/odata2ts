import { QParam, UrlParamValueFormatter, UrlParamValueParser } from "../../internal";
import { getParamValue, parseParamValue } from "../UrlParamHelper";

export const getUrlConformValue: UrlParamValueFormatter<number> = (value) => {
  return getParamValue(value);
};

export const parseValueFromUrl: UrlParamValueParser<number> = (urlConformValue) => {
  const value = parseParamValue(urlConformValue);
  return typeof value === "string" ? Number(urlConformValue) : value;
};

export class QNumberParam extends QParam<number> {
  getUrlConformValue = getUrlConformValue;
  parseValueFromUrl = parseValueFromUrl;
}
