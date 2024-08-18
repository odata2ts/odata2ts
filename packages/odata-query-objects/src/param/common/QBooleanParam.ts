import { QParam } from "../QParam.js";
import { formatLiteralParam, parseLiteral } from "../UrlParamHelper.js";
import { UrlParamValueParser } from "../UrlParamModel.js";

const parseValueFromUrl: UrlParamValueParser<boolean> = (urlConformValue) => {
  const value = parseLiteral(urlConformValue);
  return typeof value !== "string" ? value : value === "true" ? true : value === "false" ? false : undefined;
};

export class QBooleanParam<ConvertedType = boolean> extends QParam<boolean, ConvertedType> {
  protected getUrlConformValue = formatLiteralParam;
  protected parseValueFromUrl = parseValueFromUrl;
}
