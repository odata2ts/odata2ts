import { QParam, QGuidPath } from "../../internal";

export class QGuidParam extends QParam<string> {
  formatUrlValue = QGuidPath.getUrlConformValue;
  parseUrlValue = QGuidPath.parseValueFromUrl;
}
