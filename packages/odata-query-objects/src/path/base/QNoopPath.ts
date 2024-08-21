import { QPathModel } from "../QPathModel.js";

export abstract class QNoopPath implements QPathModel {
  public constructor(private path: string) {
    if (!path || !path.trim()) {
      throw new Error("Path must be supplied!");
    }
  }

  public getPath(): string {
    return this.path;
  }
}
