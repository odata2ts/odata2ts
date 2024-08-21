import { QStringNumberV2Param } from "./QStringNumberV2Param.js";

export class QInt64V2Param<ConvertedType = string> extends QStringNumberV2Param<ConvertedType> {
  protected getTypeSuffix() {
    return "L";
  }
}
