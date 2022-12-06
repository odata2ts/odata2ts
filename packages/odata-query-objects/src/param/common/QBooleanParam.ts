import * as qparam from "../QParam";
import { formatLiteralParam, parseLiteral } from "../UrlParamHelper";
import { UrlParamValueParser } from "../UrlParamModel";

const parseValueFromUrl: UrlParamValueParser<boolean> = (urlConformValue) => {
  const value = parseLiteral(urlConformValue);
  return typeof value !== "string" ? value : value === "true" ? true : value === "false" ? false : undefined;
};

export class QBooleanParam<ConvertedType = boolean> extends qparam.QParam<boolean, ConvertedType> {
  getUrlConformValue = formatLiteralParam;
  parseValueFromUrl = parseValueFromUrl;
}
