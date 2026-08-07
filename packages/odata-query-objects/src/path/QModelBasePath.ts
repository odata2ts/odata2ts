import { QueryObject } from "../QueryObject";
import { QBinding } from "./QBinding";
import { QEntityPathModel } from "./QPathModel";

export class QModelBasePath<Q extends QueryObject> implements QEntityPathModel<Q> {
  /**
   * What joins this path to the paths of the nested properties. The slash of OData, unless a subclass
   * states otherwise - see {@link QFlatComplexPath}.
   */
  protected readonly separator: string = "/";

  constructor(
    protected path: string,
    protected qEntityFn: () => new (prefix?: string, separator?: string) => Q,
    protected binding?: QBinding<any>,
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

  public getBinding(): QBinding<any> | undefined {
    return this.binding;
  }

  public getEntity(withPrefix: boolean = false): Q {
    return new (this.qEntityFn())(withPrefix ? this.path : undefined, this.separator);
  }

  public isCollectionType() {
    return false;
  }

  public get props(): Q {
    return new (this.qEntityFn())(this.path, this.separator);
  }
}
