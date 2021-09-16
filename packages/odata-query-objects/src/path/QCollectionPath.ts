import { LambdaFunctions } from "../odata/ODataModel";
import { QEntityModel, QFilterExpression, QPathModel } from "./../";

export class QCollectionPath<CollectionType> implements QPathModel {
  constructor(private path: string, private qEntityFn: () => QEntityModel<CollectionType>) {
    if (!path || !path.trim()) {
      throw Error("Path must be supplied!");
    }
    if (!qEntityFn || typeof qEntityFn !== "function") {
      throw Error("Function which returns query object must be supplied!");
    }
  }

  public withPath(newPath: string): QCollectionPath<CollectionType> {
    return new QCollectionPath(newPath, this.qEntityFn);
  }

  public getPath(): string {
    return this.path;
  }

  public getEntity(): QEntityModel<CollectionType> {
    return this.qEntityFn();
  }

  private lambdaFunction(
    operationName: string,
    fn: (qObject: QEntityModel<CollectionType>) => QFilterExpression,
    prefix: string
  ) {
    const expression = fn(this.qEntityFn());
    if (!expression.toString()) {
      return expression;
    }

    // $it is a constant for any primitive collection => just replace it within the string
    const replacedExpression = expression.toString().replace(/\$it/g, prefix);
    return new QFilterExpression(`${this.path}/${operationName}(${prefix}:${replacedExpression})`);
  }

  public any(
    fn: (qObject: QEntityModel<CollectionType>) => QFilterExpression,
    prefix: string = "a"
  ): QFilterExpression {
    return this.lambdaFunction(LambdaFunctions.ANY, fn, prefix);
  }

  public all(
    fn: (qObject: QEntityModel<CollectionType>) => QFilterExpression,
    prefix: string = "a"
  ): QFilterExpression {
    return this.lambdaFunction(LambdaFunctions.ALL, fn, prefix);
  }
}
