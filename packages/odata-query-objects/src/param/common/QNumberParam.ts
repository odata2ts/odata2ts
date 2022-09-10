import { QParam, QNumberPath } from "../../internal";

export class QNumberParam extends QParam<number> {
  formatUrlValue = QNumberPath.getUrlConformValue;
  parseUrlValue = QNumberPath.parseValueFromUrl;
}
