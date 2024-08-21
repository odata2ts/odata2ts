import { ValueConverter } from "@odata2ts/converter-api";
import { LambdaFunctions } from "../odata/ODataModel.js";
import { QFilterExpression } from "../QFilterExpression.js";
import { QueryObject } from "../QueryObject.js";
import { LambdaOperatorType } from "./base/LambdaOperatorType.js";
import { QEntityPathModel } from "./QPathModel.js";

export class QCollectionPath<CollectionType extends QueryObject> implements QEntityPathModel<CollectionType> {
  constructor(
    private path: string,
    private qEntityFn: () => new (prefix?: string, converter?: ValueConverter<any, any>) => CollectionType,
    private __converter?: ValueConverter<any, any>,
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

  public getEntity(withPrefix: boolean = false): CollectionType {
    return new (this.qEntityFn())(withPrefix ? this.path : undefined, this.__converter);
  }

  public isCollectionType() {
    return true;
  }

  private lambdaFunction(operationName: string, fn?: LambdaOperatorType<CollectionType>, prefix: string = "a") {
    // no prefix here => because $it needs to be replaced
    const expression = fn ? fn(new (this.qEntityFn())()) : undefined;

    // if no expression was provided => function call without args
    if (!expression || !expression.toString()) {
      return new QFilterExpression(`${this.path}/${operationName}()`);
    }

    // $it is a constant for any primitive collection => just replace it within the string
    const replacedExpression = expression.toString().replace(/\$it/g, prefix);
    return new QFilterExpression(`${this.path}/${operationName}(${prefix}:${replacedExpression})`);
  }

  public any(fn?: LambdaOperatorType<CollectionType>, prefix?: string): QFilterExpression {
    return this.lambdaFunction(LambdaFunctions.ANY, fn, prefix);
  }

  public all(fn?: LambdaOperatorType<CollectionType>, prefix?: string): QFilterExpression {
    return this.lambdaFunction(LambdaFunctions.ALL, fn, prefix);
  }
}
