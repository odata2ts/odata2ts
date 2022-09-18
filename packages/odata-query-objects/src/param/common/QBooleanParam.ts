import { QParam, UrlParamValueParser } from "../../internal";
import { formatLiteralParam, parseLiteral } from "../UrlParamHelper";

export const parseValueFromUrl: UrlParamValueParser<boolean> = (urlConformValue) => {
  const value = parseLiteral(urlConformValue);
  return typeof value !== "string" ? value : value === "true" ? true : value === "false" ? false : undefined;
};

export class QBooleanParam<ConvertedType = boolean> extends QParam<boolean, ConvertedType> {
  getUrlConformValue = formatLiteralParam;
  parseValueFromUrl = parseValueFromUrl;
}
