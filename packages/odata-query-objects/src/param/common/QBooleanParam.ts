import { QParam, QBooleanPath } from "../../internal";

export class QBooleanParam extends QParam<boolean> {
  formatUrlValue = QBooleanPath.getUrlConformValue;
  parseUrlValue = QBooleanPath.parseValueFromUrl;
}
