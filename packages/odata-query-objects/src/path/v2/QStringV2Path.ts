import { StringFilterFunctions } from "../../odata/ODataModel";
import { QFilterExpression } from "../../QFilterExpression";
import { InputModel } from "../base/QBasePath";
import { QStringBasePath } from "../base/QStringBasePath";

export class QStringV2Path<ConvertedType = string> extends QStringBasePath<
  QStringV2Path<ConvertedType>,
  ConvertedType
> {
  protected create(path: string) {
    return new QStringV2Path(path, this.converter);
  }

  public contains(value: InputModel<this["converter"]>) {
    return new QFilterExpression(
      `${StringFilterFunctions.SUBSTRING_OF}(${this.convertInput(value)},${this.getPath()})`
    );
  }
}
