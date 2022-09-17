import { StandardFilterOperators } from "../odata/ODataModel";
import { buildQFilterOperation } from "../param/UrlParamHelper";
import { QBasePath } from "./base/QBasePath";

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
