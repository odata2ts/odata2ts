import { QParam, UrlParamValueFormatter, UrlParamValueParser } from "../../internal";
import { createParsingRegexp, getParamValue, parseParamValue } from "../UrlParamHelper";
import { UrlParamModel } from "../UrlParamModel";

export const TIME_V2_TYPE_PREFIX = "time";
const URL_PARAM_CONFIG: UrlParamModel = { typePrefix: TIME_V2_TYPE_PREFIX };
const URL_PARAM_REGEXP = createParsingRegexp(URL_PARAM_CONFIG);

export const getUrlConformValue: UrlParamValueFormatter<string> = (value) => {
  return getParamValue(value, URL_PARAM_CONFIG);
};

export const parseValueFromUrl: UrlParamValueParser<string> = (urlConformValue) => {
  return parseParamValue(urlConformValue, URL_PARAM_REGEXP);
};

export class QTimeV2Param<ConvertedType = string> extends QParam<string, ConvertedType> {
  getUrlConformValue = getUrlConformValue;
  parseValueFromUrl = parseValueFromUrl;
}
