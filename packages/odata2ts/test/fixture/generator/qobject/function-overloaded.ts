import { QFunction, QGuidParam, QStringParam } from "@odata2ts/odata-query-objects";

// @ts-ignore
import { OverloadedFunctionParams } from "./TesterModel";

export class QOverloadedFunction extends QFunction<OverloadedFunctionParams> {
  private readonly params = [[new QStringParam("test"), new QStringParam("optTest")], [new QGuidParam("id")]];

  constructor() {
    super("OverloadedFunction");
  }

  getParams() {
    return this.params;
  }
}
