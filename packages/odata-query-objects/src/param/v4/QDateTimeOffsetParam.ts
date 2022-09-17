import { QParam } from "../QParam";
import { getParamValue, parseParamValue } from "../UrlParamHelper";

export class QDateTimeOffsetParam extends QParam<string> {
  getUrlConformValue = getParamValue;
  parseValueFromUrl = parseParamValue;
}
