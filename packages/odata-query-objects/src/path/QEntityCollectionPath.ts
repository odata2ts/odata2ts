import { QEntityModel, QPathModel, QFilterExpression } from "..";
import { LambdaFunctions } from "../odata/ODataModel";

export class QEntityCollectionPath<Type, EnumTypes = null> implements QPathModel {
  constructor(private path: string, private qEntityFn: () => QEntityModel<Type, EnumTypes>) {
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

  public withPath(newPath: string): QEntityCollectionPath<Type, EnumTypes> {
    return new QEntityCollectionPath(newPath, this.qEntityFn);
  }

  public getEntity(): QEntityModel<Type, EnumTypes> {
    return this.qEntityFn();
  }

  private lambdaFunction(
    operationName: string,
    fn: (qObject: QEntityModel<Type, EnumTypes>) => QFilterExpression,
    prefix: string
  ) {
    // create new qObject out of old one, but prefix every path object
    const qEntity = this.qEntityFn();
    const prefixedQ = Object.entries(qEntity).reduce((collector, [key, value]) => {
      // @ts-ignore: dynamic stuff
      collector[key] = value.withPath(`${prefix}/${value.getPath()}`);
      return collector;
    }, {} as QEntityModel<Type, EnumTypes>);

    const expression = fn(prefixedQ);
    return expression.toString()
      ? new QFilterExpression(`${this.path}/${operationName}(${prefix}:${expression})`)
      : expression;
  }

  public any(
    fn: (qObject: QEntityModel<Type, EnumTypes>) => QFilterExpression,
    prefix: string = "a"
  ): QFilterExpression {
    return this.lambdaFunction(LambdaFunctions.ANY, fn, prefix);
  }

  public all(
    fn: (qObject: QEntityModel<Type, EnumTypes>) => QFilterExpression,
    prefix: string = "a"
  ): QFilterExpression {
    return this.lambdaFunction(LambdaFunctions.ALL, fn, prefix);
  }
}
