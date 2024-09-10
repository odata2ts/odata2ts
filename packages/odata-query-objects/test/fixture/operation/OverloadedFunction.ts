import { booleanToNumberConverter } from "@odata2ts/test-converters";
import { OperationReturnType, QBooleanParam, QFunction, QNumberParam, QStringParam, ReturnTypes } from "../../../src";

export type OverloadedFunctionParamModel =
  | {
      testNumber: number;
      testBoolean: number;
    }
  | { id: string }
  | string;

export class QOverloadedFunction extends QFunction<OverloadedFunctionParamModel> {
  private readonly params = [
    [
      new QNumberParam("TestNumber", "testNumber"),
      new QBooleanParam("test_Boolean", "testBoolean", booleanToNumberConverter),
    ],
    [new QStringParam("ID", "id")],
  ];

  constructor() {
    super("OverloadedFunction", new OperationReturnType(ReturnTypes.VALUE, new QBooleanParam("NONE")));
  }

  public getParams() {
    return this.params;
  }
}
