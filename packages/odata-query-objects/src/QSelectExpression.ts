import { QPathModel } from "./path/QPathModel";

export class QSelectExpression implements QPathModel {
  private readonly path: string | undefined;

  constructor(path?: string) {
    this.path = path ? path.trim() : undefined;
  }

  public getPath(): string {
    return this.path ?? "";
  }
}
