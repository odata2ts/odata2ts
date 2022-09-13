import { QParam, UrlParamValueFormatter, UrlParamValueParser } from "../../internal";
import { createParsingRegexp, getParamValue, parseParamValue } from "../UrlParamHelper";
import { ParamValueModel, UrlParamModel } from "../UrlParamModel";

export const URL_PARAM_CONFIG: UrlParamModel = { isQuoted: true };
const URL_PARAM_REGEXP = createParsingRegexp(URL_PARAM_CONFIG);

const getUrlConformValue: UrlParamValueFormatter<string> = (value) => {
  return getParamValue(value, URL_PARAM_CONFIG);
};

const parseValueFromUrl: UrlParamValueParser<string> = (urlConformValue) => {
  return parseParamValue(urlConformValue, URL_PARAM_REGEXP);
};

export class QStringParam<ConvertedType = ParamValueModel<string>> extends QParam<string, ConvertedType> {
  getUrlConformValue = getUrlConformValue;
  parseValueFromUrl = parseValueFromUrl;
}
