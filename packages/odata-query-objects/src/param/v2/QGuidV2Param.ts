import { QParam } from "../QParam";
import { formatParamWithTypePrefix, parseWithTypePrefix } from "../UrlParamHelper";
import { UrlParamValueFormatter, UrlParamValueParser } from "../UrlParamModel";

export const GUID_V2_TYPE_PREFIX = "guid";

export const getUrlConformValue: UrlParamValueFormatter<string> = (value) => {
  return formatParamWithTypePrefix(GUID_V2_TYPE_PREFIX, value);
};

export const parseValueFromUrl: UrlParamValueParser<string> = (urlConformValue) => {
  return parseWithTypePrefix(GUID_V2_TYPE_PREFIX, urlConformValue);
};

export class QGuidV2Param<ConvertedType = string> extends QParam<string, ConvertedType> {
  getUrlConformValue = getUrlConformValue;
  parseValueFromUrl = parseValueFromUrl;
}
