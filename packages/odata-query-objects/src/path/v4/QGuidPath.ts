import { QBasePath } from "../base/QBasePath";

export class QGuidPath<ConvertedType = string> extends QBasePath<string, ConvertedType> {
  protected formatValue(value: string) {
    return value;
  }
}
