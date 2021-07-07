import { QFilterExpression } from "../../QFilterExpression";
import { QPathModel } from "../QPathModel";

export abstract class QLiteralPath<ValueType, OperatorTypes> implements QPathModel {
  constructor(protected path: string) {
    if (!path || !path.trim()) {
      throw Error("Path must be supplied!");
    }
  }

  public getPath(): string {
    return this.path;
  }

  protected buildBuiltInExpression(operator: OperatorTypes, value: ValueType) {
    return new QFilterExpression(this.buildBuiltInOp(operator, value));
  }

  protected buildBuiltInOp(operator: OperatorTypes, value: ValueType) {
    return `${this.path} ${operator} ${value}`;
  }
}
