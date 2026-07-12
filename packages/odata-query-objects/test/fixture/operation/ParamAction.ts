import { ODataValueResponseV4 } from "@odata2ts/odata-core";
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
  ValueResponseConverterV4,
} from "../../../src";
import { SampleResponseConverter } from "./SampleResponseConverter";

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

export class QParamAction extends QAction<ParamActionParamModel, ODataValueResponseV4<string>> {
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
    super(PARAM_ACTION_NAME, new ValueResponseConverterV4<string>(SampleResponseConverter));
  }

  public getParams() {
    return this.params;
  }
}
