import { QParam, QTimeOfDayPath } from "../../internal";

export class QTimeOfDayParam extends QParam<string> {
  formatUrlValue = QTimeOfDayPath.getUrlConformValue;
  parseUrlValue = QTimeOfDayPath.parseValueFromUrl;
}
