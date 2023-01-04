import {
  QBooleanParam,
  QDateTimeOffsetV2Param,
  QDateTimeV2Param,
  QDecimalV2Param,
  QDoubleV2Param,
  QFunction,
  QGuidV2Param,
  QInt64V2Param,
  QNumberParam,
  QSingleV2Param,
  QStringNumberV2Param,
  QStringParam,
  QTimeV2Param,
} from "@odata2ts/odata-query-objects";
import { booleanToNumberConverter } from "@odata2ts/test-converters";

// @ts-ignore
import { MaxFunctionParams } from "./TesterModel";

export class QMaxFunction extends QFunction<MaxFunctionParams> {
  private readonly params = [
    new QStringParam("TEST_STRING", "testString"),
    new QNumberParam("testInt16"),
    new QNumberParam("testInt32"),
    new QStringNumberV2Param("testByte"),
    new QStringNumberV2Param("testSByte"),
    new QInt64V2Param("testInt64"),
    new QSingleV2Param("testSingle"),
    new QDoubleV2Param("testDouble"),
    new QDecimalV2Param("testDecimal"),
    new QBooleanParam("testBoolean", undefined, booleanToNumberConverter),
    new QGuidV2Param("testGuid"),
    new QTimeV2Param("testTime"),
    new QDateTimeV2Param("testDate"),
    new QDateTimeOffsetV2Param("testDateTimeOffset"),
  ];

  constructor() {
    super("MAX_FUNCTION", undefined, { v2Mode: true });
  }

  getParams() {
    return this.params;
  }
}
