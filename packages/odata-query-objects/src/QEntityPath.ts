import { QEntityModel } from "./QEntityFactory";
import { QPathModel } from "./QEntityModel";

export class QEntityPath<Type> implements QPathModel {
  constructor(private path: string, private qEntity: Omit<QEntityModel<Type, any>, "createKey">) {
    if (!path || !path.trim()) {
      throw Error("Path must be supplied!");
    }
  }

  public getPath(): string {
    return this.path;
  }

  public getEntity() {
    return this.qEntity;
  }
}
