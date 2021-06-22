import { DateTimeFilterFunctions, StandardFilterOperators } from "../../odata/ODataModel";
import { QPathModel } from "../QPathModel";
import { QExpression } from "../QExpression";

export class DateTimeBasePath implements QPathModel {
  protected path: string;

  constructor(path: string) {
    if (!path || !path.trim()) {
      throw Error("Path must be supplied!");
    }

    this.path = path;
  }

  public getPath(): string {
    return this.path;
  }

  private buildBuiltInOp(operator: StandardFilterOperators, value: string) {
    return new QExpression(`${this.path} ${operator} ${value}`);
  }

  protected buildNoValueFunc(func: DateTimeFilterFunctions) {
    return `${func}(${this.path})`;
  }

  public equals(value: string) {
    return this.buildBuiltInOp(StandardFilterOperators.EQUALS, value);
  }
  public eq = this.equals;

  public notEquals(value: string) {
    return this.buildBuiltInOp(StandardFilterOperators.NOT_EQUALS, value);
  }
  public ne = this.notEquals;

  public lowerThan(value: string) {
    return this.buildBuiltInOp(StandardFilterOperators.LOWER_THAN, value);
  }
  public lt = this.lowerThan;

  public lowerEquals(value: string) {
    return this.buildBuiltInOp(StandardFilterOperators.LOWER_EQUALS, value);
  }
  public le = this.lowerEquals;

  public greaterThan(value: string) {
    return this.buildBuiltInOp(StandardFilterOperators.GREATER_THAN, value);
  }
  public gt = this.greaterThan;

  public greaterEquals(value: string) {
    return this.buildBuiltInOp(StandardFilterOperators.GREATER_EQUALS, value);
  }
  public ge = this.greaterEquals;
}
