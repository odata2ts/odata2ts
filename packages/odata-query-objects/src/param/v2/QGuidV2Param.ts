import { QParam, QGuidV2Path } from "../../internal";

export class QGuidV2Param extends QParam<string> {
  formatUrlValue = QGuidV2Path.getUrlConformValue;
  parseUrlValue = QGuidV2Path.parseValueFromUrl;
}
