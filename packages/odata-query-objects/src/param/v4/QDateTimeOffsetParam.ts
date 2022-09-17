import { QParam } from "../QParam";
import { getParamValue, parseParamValue } from "../UrlParamHelper";

export class QDateTimeOffsetParam<ConvertedType = string> extends QParam<string, ConvertedType> {
  getUrlConformValue = getParamValue;
  parseValueFromUrl = parseParamValue;
}
