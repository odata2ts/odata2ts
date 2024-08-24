import { QParam } from "../QParam";
import { formatLiteralParam, parseLiteral } from "../UrlParamHelper";
import { UrlParamValueParser } from "../UrlParamModel";

export const parseValueFromUrl: UrlParamValueParser<string> = (urlConformValue) => {
  return parseLiteral(urlConformValue);
};

export class QBigNumberParam<ConvertedType = string> extends QParam<string, ConvertedType> {
  getUrlConformValue = formatLiteralParam;
  parseValueFromUrl = parseValueFromUrl;
}
