import { QParam, QTimeOfDayPath } from "../../internal";

export class QTimeOfDayParam extends QParam<string> {
  getUrlConformValue = QTimeOfDayPath.getUrlConformValue;
  parseValueFromUrl = QTimeOfDayPath.parseValueFromUrl;
}
