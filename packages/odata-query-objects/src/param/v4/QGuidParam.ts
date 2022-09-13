import { QGuidPath, QParam } from "../../internal";

export class QGuidParam extends QParam<string> {
  getUrlConformValue = QGuidPath.getUrlConformValue;
  parseValueFromUrl = QGuidPath.parseValueFromUrl;
}
