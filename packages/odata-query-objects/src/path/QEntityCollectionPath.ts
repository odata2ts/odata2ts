import { LambdaFunctions } from "../odata/ODataModel.js";
import { QFilterExpression } from "../QFilterExpression.js";
import { QueryObject } from "../QueryObject.js";
import { LambdaOperatorType } from "./base/LambdaOperatorType.js";
import { QEntityPathModel } from "./QPathModel.js";

export class QEntityCollectionPath<Q extends QueryObject> implements QEntityPathModel<Q> {
  constructor(
    private path: string,
    private qEntityFn: () => new (prefix?: string) => Q,
  ) {
    if (!path || !path.trim()) {
      throw new Error("Path must be supplied!");
    }
    if (!qEntityFn || typeof qEntityFn !== "function") {
      throw new Error("Function which returns query object must be supplied!");
    }
  }

  public getPath(): string {
    return this.path;
  }

  public getEntity(withPrefix: boolean = false): Q {
    return new (this.qEntityFn())(withPrefix ? this.path : undefined);
  }

  public isCollectionType() {
    return true;
  }

  private lambdaFunction(operationName: string, fn?: LambdaOperatorType<Q>, prefix: string = "a") {
    // create new qObject with given prefix
    const qEntity = new (this.qEntityFn())(prefix);
    const expression = fn ? fn(qEntity) : undefined;

    // if no expression was provided => function call without args
    if (!expression || !expression.toString()) {
      return new QFilterExpression(`${this.path}/${operationName}()`);
    }

    return new QFilterExpression(`${this.path}/${operationName}(${prefix}:${expression})`);
  }

  public any(fn?: LambdaOperatorType<Q>, prefix?: string): QFilterExpression {
    return this.lambdaFunction(LambdaFunctions.ANY, fn, prefix);
  }

  public all(fn?: LambdaOperatorType<Q>, prefix?: string): QFilterExpression {
    return this.lambdaFunction(LambdaFunctions.ALL, fn, prefix);
  }
}
