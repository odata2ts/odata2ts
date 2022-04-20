import { QStringBasePath } from "../base/QStringBasePath";
import { StringFilterFunctions } from "../../odata/ODataModel";
import { QFilterExpression } from "../../QFilterExpression";

export class QStringV2Path extends QStringBasePath<QStringV2Path> {
  protected create(path: string) {
    return new QStringV2Path(path);
  }

  public substringOf(value: string | this) {
    return new QFilterExpression(
      `${StringFilterFunctions.SUBSTRING_OF}(${this.getFinalValue(value)},${this.getPath()})`
    );
  }
}
