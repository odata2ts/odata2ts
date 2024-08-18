import { StringFilterFunctions } from "../../odata/ODataModel";
import { QFilterExpression } from "../../QFilterExpression";
import { InputModel } from "../base/QBasePath.js";
import { QStringBasePath } from "../base/QStringBasePath.js";
import { QNumberV2Path } from "./QNumberV2Path.js";

export class QStringV2Path<ConvertedType = string> extends QStringBasePath<
  QStringV2Path<ConvertedType>,
  ConvertedType
> {
  protected create(path: string) {
    return new QStringV2Path(path, this.converter);
  }

  public indexOf(value: InputModel<this["converter"]>) {
    return new QNumberV2Path(this.getFunctionExpression(StringFilterFunctions.INDEX_OF, value));
  }

  public length() {
    const pathExpression = this.buildNoValueFunc(StringFilterFunctions.LENGTH);
    return new QNumberV2Path(pathExpression.getPath());
  }

  public contains(value: InputModel<this["converter"]>) {
    return new QFilterExpression(
      `${StringFilterFunctions.SUBSTRING_OF}(${this.convertInput(value)},${this.getPath()})`,
    );
  }
}
