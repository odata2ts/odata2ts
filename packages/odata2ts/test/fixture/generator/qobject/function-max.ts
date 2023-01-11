import {
  QBooleanParam,
  QComplexParam,
  QDateParam,
  QDateTimeOffsetParam,
  QEnumParam,
  QFunction,
  QGuidParam,
  QNumberParam,
  QStringParam,
  QStringPath,
  QTimeOfDayParam,
  QueryObject,
} from "@odata2ts/odata-query-objects";
import { booleanToNumberConverter } from "@odata2ts/test-converters";

// @ts-ignore
import { MaxFunctionParams } from "./TesterModel";

export class QTheEntity extends QueryObject {
  public readonly id = new QStringPath(this.withPrefix("id"));
}

export const qTheEntity = new QTheEntity();

export class QComplex extends QueryObject {
  public readonly a = new QStringPath(this.withPrefix("a"));
}

export const qComplex = new QComplex();

export class QMaxFunction extends QFunction<MaxFunctionParams> {
  private readonly params = [
    new QStringParam("TEST_STRING", "testString"),
    new QNumberParam("testNumber"),
    new QBooleanParam("testBoolean", undefined, booleanToNumberConverter),
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
    super("MAX_FUNCTION");
  }

  getParams() {
    return this.params;
  }
}
