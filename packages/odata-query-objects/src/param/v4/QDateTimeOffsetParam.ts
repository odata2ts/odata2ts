import { QDateTimeOffsetPath, QParam } from "../../internal";

export class QDateTimeOffsetParam extends QParam<string> {
  getUrlConformValue = QDateTimeOffsetPath.getUrlConformValue;
  parseValueFromUrl = QDateTimeOffsetPath.parseValueFromUrl;
}
