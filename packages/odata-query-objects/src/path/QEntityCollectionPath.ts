import { LambdaFunctions } from "../odata/ODataModel";
import { QFilterExpression } from "../QFilterExpression";
import { QueryObject } from "../QueryObject";
import { QEntityPathModel } from "./QPathModel";

export class QEntityCollectionPath<Q extends QueryObject> implements QEntityPathModel<Q> {
  constructor(private path: string, private qEntityFn: () => new (prefix?: string) => Q) {
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

  private lambdaFunction(operationName: string, fn: (qObject: Q) => QFilterExpression, prefix: string) {
    // create new qObject with given prefix
    const qEntity = new (this.qEntityFn())(prefix);
    const expression = fn(qEntity);
    if (!expression.toString()) {
      return expression;
    }

    return new QFilterExpression(`${this.path}/${operationName}(${prefix}:${expression})`);
  }

  public any(fn: (qObject: Q) => QFilterExpression, prefix: string = "a"): QFilterExpression {
    return this.lambdaFunction(LambdaFunctions.ANY, fn, prefix);
  }

  public all(fn: (qObject: Q) => QFilterExpression, prefix: string = "a"): QFilterExpression {
    return this.lambdaFunction(LambdaFunctions.ALL, fn, prefix);
  }
}
