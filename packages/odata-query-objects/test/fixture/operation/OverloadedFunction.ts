import { ODataValueResponseV4 } from "@odata2ts/odata-core";
import { booleanToNumberConverter } from "@odata2ts/test-converters";
import { QBooleanParam, QFunctionV4, QNumberParam, QStringParam, ValueResponseConverterV4 } from "../../../src";

export type OverloadedFunctionParamModel =
  | {
      testNumber: number;
      testBoolean: number;
    }
  | { id: string }
  | string;

export class QOverloadedFunction extends QFunctionV4<OverloadedFunctionParamModel, ODataValueResponseV4<boolean>> {
  private readonly params = [
    [
      new QNumberParam("TestNumber", "testNumber"),
      new QBooleanParam("test_Boolean", "testBoolean", booleanToNumberConverter),
    ],
    [new QStringParam("ID", "id")],
  ];

  constructor() {
    super("OverloadedFunction", new ValueResponseConverterV4<boolean>(new QBooleanParam("NONE")));
  }

  public getParams() {
    return this.params;
  }
}
