import { booleanToNumberConverter } from "@odata2ts/test-converters";

import {
  QAction,
  QBooleanParam,
  QDateParam,
  QDateTimeOffsetParam,
  QGuidParam,
  QNumberParam,
  QStringParam,
  QTimeOfDayParam,
} from "../../../src";

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

export class QParamAction extends QAction<ParamActionParamModel> {
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
    super(PARAM_ACTION_NAME);
  }

  public getParams() {
    return this.params;
  }
}
