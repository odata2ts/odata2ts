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
  QParam,
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
  private readonly params: Record<keyof BestBookParamModel, QParam<any>> = {
    testNumber: new QNumberParam("testNumber"),
    testBoolean: new QBooleanParam("testBoolean"),
    testString: new QStringParam("testString"),
    testGuid: new QGuidParam("testGuid"),
    testDate: new QDateParam("testDate"),
    testTime: new QTimeOfDayParam("testTime"),
    testDateTimeOffset: new QDateTimeOffsetParam("testDateTimeOffset"),
  };

  constructor(path: string) {
    super(path, "BestBook");
  }

  public getParams() {
    return this.params;
  }

  public buildUrl(params: BestBookParamModel): string {
    return this.formatUrl(params);
  }
}

export interface BestBookParamModelV2 {
  testBoolean?: string | null;
  testString?: string | null;
  testGuid: string | null;
  testDateTime: string | null;
  testDateTimeOffset: string | null;
  testTime: string | null;
}

export class QBestBookFunctionV2 extends QFunction<BestBookParamModelV2> {
  private readonly params: Record<keyof BestBookParamModelV2, QParam<any>> = {
    testBoolean: new QBooleanParam("testBoolean"),
    testString: new QStringParam("testString"),
    testGuid: new QGuidV2Param("testGuid"),
    testDateTime: new QDateTimeV2Param("testDateTime"),
    testDateTimeOffset: new QDateTimeOffsetV2Param("testDateTimeOffset"),
    testTime: new QTimeV2Param("testTime"),
  };

  constructor(path: string) {
    super(path, "BestBook", true);
  }

  public getParams() {
    return this.params;
  }

  public buildUrl(params: BestBookParamModelV2): string {
    return this.formatUrl(params);
  }
}
