import { QParam, UrlParamValueFormatter, UrlParamValueParser } from "../../internal";
import { formatParamWithQuotes, parseWithQuotes } from "../UrlParamHelper";

export const getUrlConformValue: UrlParamValueFormatter<string> = (value) => {
  return formatParamWithQuotes(value);
};

export const parseValueFromUrl: UrlParamValueParser<string> = (urlConformValue) => {
  return parseWithQuotes(urlConformValue);
};

export class QEnumParam<ConvertedType = string> extends QParam<string, ConvertedType> {
  getUrlConformValue = getUrlConformValue;
  parseValueFromUrl = parseValueFromUrl;
}
