import { QParam } from "../QParam.js";
import { formatLiteralParam, parseLiteral } from "../UrlParamHelper.js";
import { UrlParamValueParser } from "../UrlParamModel.js";

export const parseValueFromUrl: UrlParamValueParser<number> = (urlConformValue) => {
  const value = parseLiteral(urlConformValue);
  return typeof value === "string" ? Number(urlConformValue) : value;
};

export class QNumberParam<ConvertedType = number> extends QParam<number, ConvertedType> {
  protected getUrlConformValue = formatLiteralParam;
  protected parseValueFromUrl = parseValueFromUrl;
}
