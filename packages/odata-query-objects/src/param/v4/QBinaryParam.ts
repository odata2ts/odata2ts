import { QParam } from "../QParam.js";
import { formatLiteralParam, parseLiteral } from "../UrlParamHelper.js";

export class QBinaryParam<ConvertedType = string> extends QParam<string, ConvertedType> {
  getUrlConformValue = formatLiteralParam;
  parseValueFromUrl = parseLiteral;
}
