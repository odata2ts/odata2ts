import { OperationReturnType, QAction, QBooleanParam, QStringParam, ReturnTypes } from "@odata2ts/odata-query-objects";
import { booleanToNumberConverter } from "@odata2ts/test-converters";

// @ts-ignore
import { MinActionParams } from "./TesterModel";

export class QMinAction extends QAction<MinActionParams> {
  private readonly params = [new QStringParam("test"), new QStringParam("opt_Test", "optTest")];

  constructor() {
    super(
      "MinAction",
      new OperationReturnType(ReturnTypes.VALUE, new QBooleanParam("NONE", undefined, booleanToNumberConverter))
    );
  }

  getParams() {
    return this.params;
  }
}
