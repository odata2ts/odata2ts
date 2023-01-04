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

export interface BestBookParamModel {
  testNumber: number;
  testBoolean: number;
  testString: PrefixModel;
  testGuid: string;
  testDate?: string | null;
  testTime?: string | null;
  testDateTimeOffset?: string | null;
  testCollection?: Array<string>;
  testEntity?: BookModel | null;
}

export class QBestBookFunction extends QFunction<BestBookParamModel> {
  private readonly params = [
    new QNumberParam("TestNumber", "testNumber"),
    new QBooleanParam("test_Boolean", "testBoolean", booleanToNumberConverter),
    new QStringParam("testString", undefined, stringToPrefixModelConverter),
    new QGuidParam("testGuid"),
    new QDateParam("testDate"),
    new QTimeOfDayParam("testTime"),
    new QDateTimeOffsetParam("testDateTimeOffset"),
    new QComplexParam("testCollection", qStringCollection),
    new QComplexParam("TEST_ENTITY", new QBook(), "testEntity"),
  ];

  constructor() {
    super("BestBook", new OperationReturnType(ReturnTypes.VALUE, new QBooleanParam("NONE")));
  }

  public getParams() {
    return this.params;
  }
}

export interface BestBookParamModelV2 {
  testGuid: string;
  testDateTime: string;
  testDateTimeOffset?: string | null;
  testTime?: string | null;
  testBoolean?: string | null;
  testString?: string | null;
}

export class QBestBookFunctionV2 extends QFunction<BestBookParamModelV2> {
  private readonly params = [
    new QGuidV2Param("testGuid"),
    new QDateTimeV2Param("testDateTime"),
    new QDateTimeOffsetV2Param("testDateTimeOffset"),
    new QTimeV2Param("testTime"),
    new QBooleanParam("testBoolean"),
    new QStringParam("testString"),
  ];

  constructor() {
    super("BestBook", new OperationReturnType(ReturnTypes.VALUE, new QBooleanParam("NONE")), { v2Mode: true });
  }

  public getParams() {
    return this.params;
  }
}
