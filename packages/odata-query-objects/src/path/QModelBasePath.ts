import { QueryObject } from "../QueryObject";
import type { QueryObjectModel } from "../QueryObjectModel";
import { QBinding } from "./QBinding";
import { QEntityPathModel } from "./QPathModel";

/**
 * A factory for a fresh, unprefixed Q-object instance of one entity/complex type - the same shape this
 * class's own `qEntityFn` constructor argument uses (modulo the specific `Q` it yields), named so a write's
 * payload or a read's response can be walked for the entities it embeds without any generated lookup table.
 */
export type QEntityFn = () => new (prefix?: string, separator?: string) => QueryObjectModel;

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

  /** The factory behind {@link getEntity}, for a caller that wants to construct instances itself rather than take the one instance `getEntity` returns - a graph walk recursing property by property, say. */
  public getEntityFn() {
    return this.qEntityFn;
  }

  public isCollectionType() {
    return false;
  }

  public get props(): Q {
    return new (this.qEntityFn())(this.path, this.separator);
  }
}
