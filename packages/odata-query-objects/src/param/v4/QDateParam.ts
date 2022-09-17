import { QParam } from "../QParam";
import { getParamValue, parseParamValue } from "../UrlParamHelper";

export class QDateParam extends QParam<string> {
  getUrlConformValue = getParamValue;
  parseValueFromUrl = parseParamValue;
}
