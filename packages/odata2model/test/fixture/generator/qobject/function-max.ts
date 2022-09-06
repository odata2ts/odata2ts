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

// @ts-ignore
import { MaxFunctionParams } from "./TesterModel";

export class QMaxFunction extends QFunction<MaxFunctionParams> {
  private readonly params = [
    new QStringParam("TEST_STRING", "testString"),
    new QNumberParam("testNumber"),
    new QBooleanParam("testBoolean"),
    new QGuidParam("testGuid"),
    new QTimeOfDayParam("testTime"),
    new QDateParam("testDate"),
    new QDateTimeOffsetParam("testDateTimeOffset"),
  ];

  constructor(path: string) {
    super(path, "MAX_FUNCTION");
  }

  getParams() {
    return this.params;
  }
}
