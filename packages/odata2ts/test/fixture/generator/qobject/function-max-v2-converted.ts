import { createChain } from "@odata2ts/converter-runtime";
import type { ODataValueResponseV2 } from "@odata2ts/odata-core";
import {
  QBooleanParam,
  QDateTimeOffsetV2Param,
  QDateTimeV2Param,
  QDecimalV2Param,
  QDoubleV2Param,
  QFunctionV2,
  QGuidV2Param,
  QInt64V2Param,
  QNumberParam,
  QSingleV2Param,
  QStringNumberV2Param,
  QStringParam,
  QStringV2Path,
  QTimeV2Param,
  QueryObject,
  ValueResponseConverterV2,
} from "@odata2ts/odata-query-objects";
import {
  booleanToNumberConverter,
  numberToStringConverter,
  stringToPrefixModelConverter,
} from "@odata2ts/test-converters";
// @ts-ignore
import type { MaxFunctionParams } from "./TesterModel";

export class QTheEntity extends QueryObject {
  public readonly id = new QStringV2Path(this.withPrefix("id"), stringToPrefixModelConverter);
}

export const qTheEntity = new QTheEntity();

export class QMaxFunction extends QFunctionV2<MaxFunctionParams, ODataValueResponseV2<string>> {
  private readonly params = [
    new QStringParam("TEST_STRING", "testString", stringToPrefixModelConverter),
    new QNumberParam("testInt16"),
    new QNumberParam("testInt32"),
    new QStringNumberV2Param("testByte"),
    new QStringNumberV2Param("testSByte"),
    new QInt64V2Param("testInt64"),
    new QSingleV2Param("testSingle"),
    new QDoubleV2Param("testDouble"),
    new QDecimalV2Param("testDecimal"),
    new QBooleanParam("testBoolean", undefined, createChain(booleanToNumberConverter, numberToStringConverter)),
    new QGuidV2Param("testGuid"),
    new QTimeV2Param("testTime"),
    new QDateTimeV2Param("testDate"),
    new QDateTimeOffsetV2Param("testDateTimeOffset"),
  ];

  constructor() {
    super("MAX_FUNCTION", new ValueResponseConverterV2(createChain(booleanToNumberConverter, numberToStringConverter)));
  }

  getParams() {
    return this.params;
  }
}
