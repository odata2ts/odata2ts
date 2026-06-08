import { QueryObject } from "../QueryObject";
import { QEntityPathModel } from "./QPathModel";

export class QModelBasePath<Q extends QueryObject> implements QEntityPathModel<Q> {
  constructor(
    protected path: string,
    protected qEntityFn: () => new (prefix?: string) => Q,
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
    return false;
  }

  public get props(): Q {
    return new (this.qEntityFn())(this.path);
  }
}
