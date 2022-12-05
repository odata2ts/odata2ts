import { QParam } from "../QParam";
import { formatLiteralParam, parseLiteral } from "../UrlParamHelper";
import { UrlParamValueParser } from "../UrlParamModel";

export const parseValueFromUrl: UrlParamValueParser<number> = (urlConformValue) => {
  const value = parseLiteral(urlConformValue);
  return typeof value === "string" ? Number(urlConformValue) : value;
};

export class QNumberParam<ConvertedType = number> extends QParam<number, ConvertedType> {
  getUrlConformValue = formatLiteralParam;
  parseValueFromUrl = parseValueFromUrl;
}
