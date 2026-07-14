import type { ODataValueResponseV4 } from "@odata2ts/odata-core";
import { QFunction, QStringParam } from "@odata2ts/odata-query-objects";
// @ts-ignore
import type { OverloadedFunctionParams } from "./TesterModel";

export class QOverloadedFunction extends QFunction<OverloadedFunctionParams, ODataValueResponseV4<string>> {
  private readonly params = [[], [new QStringParam("test")]];

  constructor() {
    super("OverloadedFunction");
  }

  getParams() {
    return this.params;
  }
}
