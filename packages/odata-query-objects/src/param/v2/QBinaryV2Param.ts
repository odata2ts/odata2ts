import { QParam } from "../QParam.js";
import { formatParamWithTypePrefix, parseWithTypePrefix } from "../UrlParamHelper.js";
import { UrlParamValueFormatter, UrlParamValueParser } from "../UrlParamModel.js";

export const BINARY_V2_TYPE_PREFIX = "binary";

const getUrlConformValue: UrlParamValueFormatter<string> = (value) => {
  return formatParamWithTypePrefix(BINARY_V2_TYPE_PREFIX, value);
};

const parseValueFromUrl: UrlParamValueParser<string> = (urlConformValue) => {
  return parseWithTypePrefix(BINARY_V2_TYPE_PREFIX, urlConformValue);
};

export class QBinaryV2Param<ConvertedType = string> extends QParam<string, ConvertedType> {
  getUrlConformValue = getUrlConformValue;
  parseValueFromUrl = parseValueFromUrl;
}
