import { QPathModel } from "./QPathModel";

export class QEntityPath<Type> implements QPathModel {
  constructor(private path: string, private qEntityFn: () => new (prefix?: string) => Type) {
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

  public getEntity(): Type {
    return new (this.qEntityFn())(this.path);
  }

  public get props(): Type {
    return this.getEntity();
  }
}
