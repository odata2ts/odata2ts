import { StandardFilterOperators } from "../odata/ODataModel";
import { QLiteralPath } from "./base/QLiteralPath";

export class QBooleanPath extends QLiteralPath<boolean | QBooleanPath, StandardFilterOperators> {
  public equals(value: boolean) {
    return this.buildBuiltInExpression(StandardFilterOperators.EQUALS, value);
  }
  public eq = this.equals;

  public isTrue() {
    return this.equals(true);
  }

  public isFalse() {
    return this.equals(false);
  }
}
