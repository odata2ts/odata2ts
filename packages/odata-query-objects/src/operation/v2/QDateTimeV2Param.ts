import { QParam, QDateTimeV2Path } from "../../internal";

export class QDateTimeV2Param extends QParam<string> {
  formatUrlValue = QDateTimeV2Path.getUrlConformValue;
  parseUrlValue = QDateTimeV2Path.parseValueFromUrl;
}
