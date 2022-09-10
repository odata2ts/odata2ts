import { QParam, QTimeV2Path } from "../../internal";

export class QTimeV2Param extends QParam<string> {
  formatUrlValue = QTimeV2Path.getUrlConformValue;
  parseUrlValue = QTimeV2Path.parseValueFromUrl;
}
