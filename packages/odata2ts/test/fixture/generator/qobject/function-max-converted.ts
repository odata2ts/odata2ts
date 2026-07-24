import { createChain } from "@odata2ts/converter-runtime";
import type { ODataValueResponseV4 } from "@odata2ts/odata-core";
import {
  QBooleanParam,
  QComplexParam,
  QDateParam,
  QDateTimeOffsetParam,
  QEnumParam,
  QFunctionV4,
  QGuidParam,
  QNumberParam,
  QStringParam,
  QStringPath,
  QTimeOfDayParam,
  QueryObject,
  ValueResponseConverterV4,
} from "@odata2ts/odata-query-objects";
import {
  booleanToNumberConverter,
  numberToStringConverter,
  stringToPrefixModelConverter,
} from "@odata2ts/test-converters";
// @ts-ignore
import type { MaxFunctionParams } from "./TesterModel.js";

export class QTheEntity extends QueryObject {
  public readonly id = new QStringPath(this.withPrefix("id"), stringToPrefixModelConverter);
}

export const qTheEntity = new QTheEntity();

export class QComplex extends QueryObject {
  public readonly a = new QStringPath(this.withPrefix("a"), stringToPrefixModelConverter);
}

export const qComplex = new QComplex();

export class QMaxFunction extends QFunctionV4<MaxFunctionParams, ODataValueResponseV4<string>> {
  private readonly params = [
    new QStringParam("TEST_STRING", "testString", stringToPrefixModelConverter),
    new QNumberParam("testNumber"),
    new QBooleanParam("testBoolean", undefined, createChain(booleanToNumberConverter, numberToStringConverter)),
    new QGuidParam("testGuid"),
    new QTimeOfDayParam("testTime"),
    new QDateParam("testDate"),
    new QDateTimeOffsetParam("testDateTimeOffset"),
    new QDateTimeOffsetParam("testDateTimeOffset"),
    new QComplexParam("complex", new QComplex()),
    new QComplexParam("ENTITY", new QTheEntity(), "entity"),
    new QEnumParam("enum"),
  ];

  constructor() {
    super("MAX_FUNCTION", new ValueResponseConverterV4(createChain(booleanToNumberConverter, numberToStringConverter)));
  }

  getParams() {
    return this.params;
  }
}
