import { ResponseDataAdapter } from "@odata2ts/odata-query-objects";
import { booleanToNumberConverter } from "@odata2ts/test-converters";
import {
  FlexibleConversionModel,
  QAction,
  QBooleanParam,
  QDateParam,
  QDateTimeOffsetParam,
  QGuidParam,
  QNumberParam,
  QStringParam,
  QTimeOfDayParam,
  ReturnTypes,
} from "../../../src";
import { SampleResponseConverter, SampleResponseStructure } from "./SampleResponseConverter";

export const PARAM_ACTION_NAME = "ParaM_ACTion";

export interface ParamActionParamModel {
  testString: string;
  testNumber: number;
  testBoolean: number;
  testGuid: string;
  testDate?: string | null;
  testTime?: string | null;
  testDateTimeOffset?: string | null;
}

export class QParamAction extends QAction<ParamActionParamModel, string> {
  private params = [
    new QStringParam("TEST_STRING", "testString"),
    new QNumberParam("testNumber"),
    new QBooleanParam("testBoolean", undefined, booleanToNumberConverter),
    new QGuidParam("testGuid"),
    new QDateParam("testDate"),
    new QTimeOfDayParam("testTime"),
    new QDateTimeOffsetParam("testDateTimeOffset"),
  ];

  constructor() {
    super(PARAM_ACTION_NAME, ReturnTypes.VALUE, new SampleResponseConverter());
  }

  public getParams() {
    return this.params;
  }
}
