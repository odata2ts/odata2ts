import { NumberFilterFunctions, NumberFilterOperators, StandardFilterOperators } from "./ODataModel";
import { QPathModel } from "./QEntityModel";
import { QExpression } from "./QExpression";

export class QBooleanPath implements QPathModel {
  constructor(private path: string) {
    if (!path || !path.trim()) {
      throw Error("Path must be supplied!");
    }
  }

  public getPath(): string {
    return this.path;
  }

  private buildBuiltInExpression(operator: StandardFilterOperators | NumberFilterOperators, value: boolean) {
    return new QExpression(this.buildBuiltInOp(operator, value));
  }

  private buildBuiltInOp(operator: StandardFilterOperators | NumberFilterOperators, value: boolean) {
    return `${this.path} ${operator} ${value}`;
  }

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
