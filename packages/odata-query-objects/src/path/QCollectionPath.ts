import { QPrimitiveCollection } from "../QSingletons";
import { QPathModel } from "./QPathModel";

export class QCollectionPath<Type> implements QPathModel {
  constructor(private path: string, private qEntityFn: () => QPrimitiveCollection<Type>) {
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

  public getEntity(): QPrimitiveCollection<Type> {
    return this.qEntityFn();
  }
}
