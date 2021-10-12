import { QEntityModel } from "../QEntityModel";
import { QPathModel } from "./QPathModel";

export class QEntityPath<Type, EnumTypes = undefined> implements QPathModel {
  private prefixedEntity?: QEntityModel<Type, EnumTypes>;

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

  public withPath(newPath: string): QEntityPath<Type, EnumTypes> {
    return new QEntityPath(newPath, this.qEntityFn);
  }

  public getEntity() {
    return this.qEntityFn();
  }

  private createPrefixedEntity() {
    const entity = this.getEntity();
    this.prefixedEntity = Object.entries(entity).reduce((collector, [key, value]) => {
      // @ts-ignore: dynamic stuff
      collector[key] = value.withPath(`${this.path}/${value.getPath()}`);
      return collector;
    }, {} as QEntityModel<Type, EnumTypes>);

    return this.prefixedEntity;
  }

  public get props(): QEntityModel<Type, EnumTypes> {
    if (!this.prefixedEntity) {
      return this.createPrefixedEntity();
    }
    return this.prefixedEntity;
  }
}
