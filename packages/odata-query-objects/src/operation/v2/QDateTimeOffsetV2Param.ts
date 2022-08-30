import { QParam, QDateTimeOffsetV2Path } from "../../internal";

export class QDateTimeOffsetV2Param extends QParam<string> {
  formatUrlValue = QDateTimeOffsetV2Path.getUrlConformValue;
  parseUrlValue = QDateTimeOffsetV2Path.parseValueFromUrl;
}
