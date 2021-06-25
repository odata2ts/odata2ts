import { QEntityModel } from "../QEntityModel";
import { QPathModel } from "./QPathModel";

export class QEntityCollectionPath<Type> implements QPathModel {
  constructor(private path: string, private qEntity: () => QEntityModel<Type, any>) {
    if (!path || !path.trim()) {
      throw Error("Path must be supplied!");
    }
  }

  public getPath(): string {
    return this.path;
  }

  public getEntity() {
    return this.qEntity();
  }
}
