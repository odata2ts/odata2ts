import { LambdaFunctions } from "../odata/ODataModel";
import { QFilterExpression, QPathModel } from "./../";

export class QCollectionPath<CollectionType> implements QPathModel {
  constructor(private path: string, private qEntityFn: () => new (prefix?: string) => CollectionType) {
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

  public getEntity(withPrefix: boolean = false): CollectionType {
    return new (this.qEntityFn())(withPrefix ? this.path : undefined);
  }

  private lambdaFunction(operationName: string, fn: (qObject: CollectionType) => QFilterExpression, prefix: string) {
    // no prefix here => because $it needs to be replaced
    const expression = fn(new (this.qEntityFn())());
    if (!expression.toString()) {
      return expression;
    }

    // $it is a constant for any primitive collection => just replace it within the string
    const replacedExpression = expression.toString().replace(/\$it/g, prefix);
    return new QFilterExpression(`${this.path}/${operationName}(${prefix}:${replacedExpression})`);
  }

  public any(fn: (qObject: CollectionType) => QFilterExpression, prefix: string = "a"): QFilterExpression {
    return this.lambdaFunction(LambdaFunctions.ANY, fn, prefix);
  }

  public all(fn: (qObject: CollectionType) => QFilterExpression, prefix: string = "a"): QFilterExpression {
    return this.lambdaFunction(LambdaFunctions.ALL, fn, prefix);
  }
}
