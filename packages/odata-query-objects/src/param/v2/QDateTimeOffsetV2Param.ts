import { QParam } from "../QParam";
import { formatParamWithTypePrefix, parseWithTypePrefix } from "../UrlParamHelper";
import { UrlParamValueFormatter, UrlParamValueParser } from "../UrlParamModel";

export const DATE_TIME_OFFSET_V2_TYPE_PREFIX = "datetimeoffset";

const getUrlConformValue: UrlParamValueFormatter<string> = (value) => {
  return formatParamWithTypePrefix(DATE_TIME_OFFSET_V2_TYPE_PREFIX, value);
};

const parseValueFromUrl: UrlParamValueParser<string> = (urlConformValue) => {
  return parseWithTypePrefix(DATE_TIME_OFFSET_V2_TYPE_PREFIX, urlConformValue);
};

export class QDateTimeOffsetV2Param<ConvertedType = string> extends QParam<string, ConvertedType> {
  getUrlConformValue = getUrlConformValue;
  parseValueFromUrl = parseValueFromUrl;
}
