import {
  QBooleanParam,
  QDateTimeOffsetV2Param,
  QDateTimeV2Param,
  QFunction,
  QGuidV2Param,
  QNumberParam,
  QStringParam,
  QTimeV2Param,
} from "@odata2ts/odata-query-objects";
import { booleanToNumberConverter } from "@odata2ts/test-converters";

// @ts-ignore
import { MaxFunctionParams } from "./TesterModel";

export class QMaxFunction extends QFunction<MaxFunctionParams> {
  private readonly params = [
    new QStringParam("TEST_STRING", "testString"),
    new QNumberParam("testNumber"),
    new QBooleanParam("testBoolean", undefined, booleanToNumberConverter),
    new QGuidV2Param("testGuid"),
    new QTimeV2Param("testTime"),
    new QDateTimeV2Param("testDate"),
    new QDateTimeOffsetV2Param("testDateTimeOffset"),
  ];

  constructor() {
    super("MAX_FUNCTION", true);
  }

  getParams() {
    return this.params;
  }
}
