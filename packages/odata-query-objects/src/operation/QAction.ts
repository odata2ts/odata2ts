import { QParam } from "./QParam";
import { compileOperationPath } from "./OperationHelper";

export abstract class QAction<ParamModel = undefined> {
  public constructor(protected path: string, protected name: string) {}

  public abstract getParams(): Record<string, QParam<any>> | undefined;

  public buildUrl() {
    return `${compileOperationPath(this.path, this.name)}()`;
  }
}