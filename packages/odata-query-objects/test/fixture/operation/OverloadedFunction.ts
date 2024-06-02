import { PrefixModel, booleanToNumberConverter, stringToPrefixModelConverter } from "@odata2ts/test-converters";

import {
  OperationReturnType,
  QBooleanParam,
  QComplexParam,
  QDateParam,
  QDateTimeOffsetParam,
  QDateTimeOffsetV2Param,
  QDateTimeV2Param,
  QFunction,
  QGuidParam,
  QGuidV2Param,
  QNumberParam,
  QStringParam,
  QTimeOfDayParam,
  QTimeV2Param,
  ReturnTypes,
  qStringCollection,
} from "../../../src";
import { BookModel, QBook } from "./BookModel";

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
