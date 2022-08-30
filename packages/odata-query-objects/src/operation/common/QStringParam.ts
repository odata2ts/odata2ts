import { QParam, QStringPath } from "../../internal";

export class QStringParam extends QParam<string> {
  formatUrlValue = QStringPath.getUrlConformValue;
  parseUrlValue = QStringPath.parseValueFromUrl;
}
