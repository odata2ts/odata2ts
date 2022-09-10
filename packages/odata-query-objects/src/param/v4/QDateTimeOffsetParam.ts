import { QParam, QDateTimeOffsetPath } from "../../internal";

export class QDateTimeOffsetParam extends QParam<string> {
  formatUrlValue = QDateTimeOffsetPath.getUrlConformValue;
  parseUrlValue = QDateTimeOffsetPath.parseValueFromUrl;
}
