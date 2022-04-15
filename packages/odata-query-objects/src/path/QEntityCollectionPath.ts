import { QPathModel, QFilterExpression } from "..";
import { LambdaFunctions } from "../odata/ODataModel";

export class QEntityCollectionPath<Type> implements QPathModel {
  constructor(private path: string, private qEntityFn: () => new (prefix?: string) => Type) {
    if (!path || !path.trim()) {
      throw Error("Path must be supplied!");
    }
    if (!qEntityFn || typeof qEntityFn !== "function") {
      throw Error("Function which returns query object must be supplied!");
    }
  }

  public getPath(): string {
    return this.path;
  }

  public getEntity(withPrefix: boolean = false): Type {
    return new (this.qEntityFn())(withPrefix ? this.path : undefined);
  }

  private lambdaFunction(operationName: string, fn: (qObject: Type) => QFilterExpression, prefix: string) {
    // create new qObject with given prefix
    const qEntity = new (this.qEntityFn())(prefix);
    const expression = fn(qEntity);
    if (!expression.toString()) {
      return expression;
    }

    return new QFilterExpression(`${this.path}/${operationName}(${prefix}:${expression})`);
  }

  public any(fn: (qObject: Type) => QFilterExpression, prefix: string = "a"): QFilterExpression {
    return this.lambdaFunction(LambdaFunctions.ANY, fn, prefix);
  }

  public all(fn: (qObject: Type) => QFilterExpression, prefix: string = "a"): QFilterExpression {
    return this.lambdaFunction(LambdaFunctions.ALL, fn, prefix);
  }
}
