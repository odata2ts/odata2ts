import { QPathModel } from "./QPathModel";

const PRIMITIVE_VALUE_REFERENCE = "$it";

export type Constructor<T> = new (p: string) => T;

export class QPrimitiveCollectionPath<T> implements QPathModel {
  qPath: T;

  constructor(private path: string, qPrimitivePathConstructor: Constructor<T>) {
    if (!path || !path.trim()) {
      throw Error("Path must be supplied!");
    }
    if (!qPrimitivePathConstructor || typeof qPrimitivePathConstructor !== "function") {
      throw Error("Function which returns query object must be supplied!");
    }
    this.qPath = new qPrimitivePathConstructor(PRIMITIVE_VALUE_REFERENCE);
  }

  public getPath(): string {
    return this.path;
  }

  public getQPath(): T {
    return this.qPath;
  }
}
