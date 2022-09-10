import { QParam, QDatePath } from "../../internal";

export class QDateParam extends QParam<string> {
  formatUrlValue = QDatePath.getUrlConformValue;
  parseUrlValue = QDatePath.parseValueFromUrl;
}
