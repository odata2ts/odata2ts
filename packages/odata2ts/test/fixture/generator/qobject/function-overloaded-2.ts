import { QFunction, QStringParam } from "@odata2ts/odata-query-objects";

// @ts-ignore
import { OverloadedFunctionParams } from "./TesterModel";

export class QOverloadedFunction extends QFunction<OverloadedFunctionParams> {
  private readonly params = [[], [new QStringParam("test")]];

  constructor() {
    super("OverloadedFunction");
  }

  getParams() {
    return this.params;
  }
}
