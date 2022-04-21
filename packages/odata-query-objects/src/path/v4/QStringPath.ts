import { StringFilterFunctions } from "../../odata/ODataModel";
import { QStringBasePath } from "../base/QStringBasePath";

export class QStringPath extends QStringBasePath<QStringPath> {
  protected create(path: string) {
    return new QStringPath(path);
  }

  public contains(value: string | this) {
    return this.buildFunc(StringFilterFunctions.CONTAINS, value);
  }

  public matchesPattern(value: string | this) {
    return this.buildFunc(StringFilterFunctions.MATCHES_PATTERN, value);
  }
}
