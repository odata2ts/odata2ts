import { DateTimeFilterFunctions, StandardFilterOperators } from "../../odata/ODataModel";
import { QFilterExpression } from "../../QFilterExpression";
import { QLiteralPath } from "../base/QLiteralPath";

export abstract class DateTimeBasePath extends QLiteralPath<string, StandardFilterOperators> {
  abstract withPath(newPath: string): any;

  public equals(value: string) {
    return this.buildBuiltInExpression(StandardFilterOperators.EQUALS, value);
  }
  public eq = this.equals;

  public notEquals(value: string) {
    return this.buildBuiltInExpression(StandardFilterOperators.NOT_EQUALS, value);
  }
  public ne = this.notEquals;

  public lowerThan(value: string) {
    return this.buildBuiltInExpression(StandardFilterOperators.LOWER_THAN, value);
  }
  public lt = this.lowerThan;

  public lowerEquals(value: string) {
    return this.buildBuiltInExpression(StandardFilterOperators.LOWER_EQUALS, value);
  }
  public le = this.lowerEquals;

  public greaterThan(value: string) {
    return this.buildBuiltInExpression(StandardFilterOperators.GREATER_THAN, value);
  }
  public gt = this.greaterThan;

  public greaterEquals(value: string) {
    return this.buildBuiltInExpression(StandardFilterOperators.GREATER_EQUALS, value);
  }
  public ge = this.greaterEquals;

  public in(...values: Array<string>) {
    return values.reduce((expression, value) => {
      const expr = this.buildBuiltInExpression(StandardFilterOperators.EQUALS, value);
      return expression ? expression.or(expr) : expr;
    }, null as unknown as QFilterExpression);
  }
}
