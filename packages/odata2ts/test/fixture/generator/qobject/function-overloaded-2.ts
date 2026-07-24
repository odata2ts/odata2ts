import type { ODataValueResponseV4 } from "@odata2ts/odata-core";
import { QFunctionV4, QStringParam } from "@odata2ts/odata-query-objects";
// @ts-ignore
import type { OverloadedFunctionParams } from "./TesterModel.js";

export class QOverloadedFunction extends QFunctionV4<OverloadedFunctionParams, ODataValueResponseV4<string>> {
  private readonly params = [[], [new QStringParam("test")]];

  constructor() {
    super("OverloadedFunction");
  }

  getParams() {
    return this.params;
  }
}
