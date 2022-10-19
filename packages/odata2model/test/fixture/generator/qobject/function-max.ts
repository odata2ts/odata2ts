import {
  QBooleanParam,
  QDateParam,
  QDateTimeOffsetParam,
  QFunction,
  QGuidParam,
  QNumberParam,
  QStringParam,
  QTimeOfDayParam,
} from "@odata2ts/odata-query-objects";
import { booleanToNumberConverter } from "@odata2ts/test-converters";

// @ts-ignore
import { MaxFunctionParams } from "./TesterModel";

export class QMaxFunction extends QFunction<MaxFunctionParams> {
  private readonly params = [
    new QStringParam("TEST_STRING"),
    new QNumberParam("testNumber"),
    new QBooleanParam("testBoolean", undefined, booleanToNumberConverter),
    new QGuidParam("testGuid"),
    new QTimeOfDayParam("testTime"),
    new QDateParam("testDate"),
    new QDateTimeOffsetParam("testDateTimeOffset"),
  ];

  constructor() {
    super("MAX_FUNCTION");
  }

  getParams() {
    return this.params;
  }
}
