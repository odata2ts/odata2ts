import { QPathModel } from "../QPathModel";

export abstract class QNoopPath implements QPathModel {
  constructor(private path: string) {
    if (!path || !path.trim()) {
      throw Error("Path must be supplied!");
    }
  }

  public getPath(): string {
    return this.path;
  }

  abstract withPath(newPath: string): any;
}
