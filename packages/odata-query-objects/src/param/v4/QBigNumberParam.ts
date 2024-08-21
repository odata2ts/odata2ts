import { QParam } from "../QParam.js";
import { formatLiteralParam, parseLiteral } from "../UrlParamHelper.js";
import { UrlParamValueParser } from "../UrlParamModel.js";

export const parseValueFromUrl: UrlParamValueParser<string> = (urlConformValue) => {
  return parseLiteral(urlConformValue);
};

export class QBigNumberParam<ConvertedType = string> extends QParam<string, ConvertedType> {
  getUrlConformValue = formatLiteralParam;
  parseValueFromUrl = parseValueFromUrl;
}
