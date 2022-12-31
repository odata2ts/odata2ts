import { StringFilterFunctions } from "../../odata/ODataModel";
import { InputModel } from "../base/QBasePath";
import { QStringBasePath } from "../base/QStringBasePath";
import { QNumberPath } from "./QNumberPath";

export class QStringPath<ConvertedType = string> extends QStringBasePath<QStringPath<ConvertedType>, ConvertedType> {
  protected create(path: string) {
    return new QStringPath(path, this.converter);
  }

  public indexOf(value: InputModel<this["converter"]>) {
    return new QNumberPath(this.getFunctionExpression(StringFilterFunctions.INDEX_OF, value));
  }

  public length() {
    const pathExpression = this.buildNoValueFunc(StringFilterFunctions.LENGTH);
    return new QNumberPath(pathExpression.getPath());
  }

  public contains(value: InputModel<this["converter"]>) {
    return this.buildFunctionFilter(StringFilterFunctions.CONTAINS, value);
  }

  public matchesPattern(value: InputModel<this["converter"]>) {
    return this.buildFunctionFilter(StringFilterFunctions.MATCHES_PATTERN, value);
  }
}
