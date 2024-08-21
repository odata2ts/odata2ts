import { QFunction, QStringParam } from "@odata2ts/odata-query-objects";
// @ts-ignore
import type { MinFunctionParams } from "./TesterModel";

export class QMinFunction extends QFunction<MinFunctionParams> {
  private readonly params = [new QStringParam("test"), new QStringParam("optTest")];

  constructor() {
    super("MinFunction");
  }

  getParams() {
    return this.params;
  }
}
