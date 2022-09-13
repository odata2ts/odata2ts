import { QDatePath, QParam } from "../../internal";

export class QDateParam extends QParam<string> {
  getUrlConformValue = QDatePath.getUrlConformValue;
  parseValueFromUrl = QDatePath.parseValueFromUrl;
}
