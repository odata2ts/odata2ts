import { QParam } from "../QParam";
import { getParamValue, parseParamValue } from "../UrlParamHelper";

export class QTimeOfDayParam<ConvertedType = string> extends QParam<string, ConvertedType> {
  getUrlConformValue = getParamValue;
  parseValueFromUrl = parseParamValue;
}
