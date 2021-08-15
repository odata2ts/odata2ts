import { QEntityModel } from "../QEntityModel";
import { QPathModel } from "./QPathModel";

export class QEntityCollectionPath<Type, EnumTypes> implements QPathModel {
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

  public getEntity(): QEntityModel<Type, EnumTypes> {
    return this.qEntityFn();
  }
}
