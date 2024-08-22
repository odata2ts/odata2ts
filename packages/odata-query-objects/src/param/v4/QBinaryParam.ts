import { QParam } from "../QParam";
import { formatLiteralParam, parseLiteral } from "../UrlParamHelper";

export class QBinaryParam<ConvertedType = string> extends QParam<string, ConvertedType> {
  getUrlConformValue = formatLiteralParam;
  parseValueFromUrl = parseLiteral;
}
