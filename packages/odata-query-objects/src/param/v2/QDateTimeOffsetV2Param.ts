import { QParam, UrlParamValueFormatter, UrlParamValueParser } from "../../internal";
import { createParsingRegexp, getParamValue, parseParamValue } from "../UrlParamHelper";
import { UrlParamModel } from "../UrlParamModel";

export const DATE_TIME_OFFSET_V2_TYPE_PREFIX = "datetimeoffset";
const URL_PARAM_CONFIG: UrlParamModel = { typePrefix: DATE_TIME_OFFSET_V2_TYPE_PREFIX };
const URL_PARAM_REGEXP = createParsingRegexp(URL_PARAM_CONFIG);

export const getUrlConformValue: UrlParamValueFormatter<string> = (value) => {
  return getParamValue(value, URL_PARAM_CONFIG);
};

export const parseValueFromUrl: UrlParamValueParser<string> = (urlConformValue) => {
  return parseParamValue(urlConformValue, URL_PARAM_REGEXP);
};

export class QDateTimeOffsetV2Param<ConvertedType = string> extends QParam<string, ConvertedType> {
  getUrlConformValue = getUrlConformValue;
  parseValueFromUrl = parseValueFromUrl;
}
