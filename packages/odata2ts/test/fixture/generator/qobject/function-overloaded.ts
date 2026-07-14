import type { ODataValueResponseV4 } from "@odata2ts/odata-core";
import { QFunctionV4, QGuidParam, QStringParam } from "@odata2ts/odata-query-objects";
// @ts-ignore
import type { OverloadedFunctionParams } from "./TesterModel";

export class QOverloadedFunction extends QFunctionV4<OverloadedFunctionParams, ODataValueResponseV4<string>> {
  private readonly params = [[new QStringParam("test"), new QStringParam("optTest")], [new QGuidParam("id")]];

  constructor() {
    super("OverloadedFunction");
  }

  getParams() {
    return this.params;
  }
}
