import {
  QBooleanParam,
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
} from "../../../src";

export interface BestBookParamModel {
  testNumber: number;
  testBoolean: boolean;
  testString: string;
  testGuid: string;
  testDate?: string | null;
  testTime?: string | null;
  testDateTimeOffset?: string | null;
}

export class QBestBookFunction extends QFunction<BestBookParamModel> {
  private readonly params = [
    new QNumberParam("TestNumber", "testNumber"),
    new QBooleanParam("test_Boolean", "testBoolean"),
    new QStringParam("testString"),
    new QGuidParam("testGuid"),
    new QDateParam("testDate"),
    new QTimeOfDayParam("testTime"),
    new QDateTimeOffsetParam("testDateTimeOffset"),
  ];

  constructor() {
    super("BestBook");
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
    super("BestBook", true);
  }

  public getParams() {
    return this.params;
  }
}
