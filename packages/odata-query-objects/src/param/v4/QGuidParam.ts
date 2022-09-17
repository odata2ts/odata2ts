import { QParam } from "../QParam";
import { getParamValue, parseParamValue } from "../UrlParamHelper";

export class QGuidParam extends QParam<string> {
  getUrlConformValue = getParamValue;
  parseValueFromUrl = parseParamValue;
}
