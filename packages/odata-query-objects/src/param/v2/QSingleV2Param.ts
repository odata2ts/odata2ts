import { QStringNumberV2Param } from "./QStringNumberV2Param";

export class QSingleV2Param<ConvertedType = string> extends QStringNumberV2Param<ConvertedType> {
  protected getTypeSuffix() {
    return "f";
  }
}
