import { StringFilterFunctions } from "../../odata/ODataModel";
import { InputModel } from "../base/QBasePath";
import { QStringBasePath } from "../base/QStringBasePath";

export class QStringPath<ConvertedType = string> extends QStringBasePath<QStringPath<ConvertedType>, ConvertedType> {
  protected create(path: string) {
    return new QStringPath(path, this.converter);
  }

  public contains(value: InputModel<this["converter"]>) {
    return this.buildFunctionFilter(StringFilterFunctions.CONTAINS, value);
  }

  public matchesPattern(value: InputModel<this["converter"]>) {
    return this.buildFunctionFilter(StringFilterFunctions.MATCHES_PATTERN, value);
  }
}
