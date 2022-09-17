import { QParam } from "../QParam";
import { getParamValue, parseParamValue } from "../UrlParamHelper";

export class QTimeOfDayParam extends QParam<string> {
  getUrlConformValue = getParamValue;
  parseValueFromUrl = parseParamValue;
}
