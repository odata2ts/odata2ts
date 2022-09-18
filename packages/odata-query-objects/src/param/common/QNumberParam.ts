import { QParam, UrlParamValueParser } from "../../internal";
import { formatLiteralParam, parseLiteral } from "../UrlParamHelper";

export const parseValueFromUrl: UrlParamValueParser<number> = (urlConformValue) => {
  const value = parseLiteral(urlConformValue);
  return typeof value === "string" ? Number(urlConformValue) : value;
};

export class QNumberParam<ConvertedType = number> extends QParam<number, ConvertedType> {
  getUrlConformValue = formatLiteralParam;
  parseValueFromUrl = parseValueFromUrl;
}
