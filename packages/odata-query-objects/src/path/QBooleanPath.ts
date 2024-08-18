import { StandardFilterOperators } from "../odata/ODataModel.js";
import { buildQFilterOperation } from "../param/UrlParamHelper.js";
import { QBasePath } from "./base/QBasePath.js";

export class QBooleanPath<ConvertedType = boolean> extends QBasePath<boolean, ConvertedType> {
  protected formatValue(value: boolean): string {
    return String(value);
  }

  public isTrue() {
    return buildQFilterOperation(this.path, StandardFilterOperators.EQUALS, "true");
  }

  public isFalse() {
    return buildQFilterOperation(this.path, StandardFilterOperators.EQUALS, "false");
  }
}
