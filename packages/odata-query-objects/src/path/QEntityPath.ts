import { QueryObject } from "../QueryObject";
import { QEntityPathModel, QPathModel } from "./QPathModel";

export class QEntityPath<Q extends QueryObject> implements QEntityPathModel<Q> {
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
    return false;
  }

  public get props(): Q {
    return new (this.qEntityFn())(this.path);
  }
}
