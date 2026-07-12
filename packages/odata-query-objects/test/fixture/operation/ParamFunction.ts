import { ODataEntityModelResponseV2, ODataModelResponseV4 } from "@odata2ts/odata-core";
import { booleanToNumberConverter, PrefixModel, stringToPrefixModelConverter } from "@odata2ts/test-converters";
import {
  EntityResponseConverterV2,
  ModelResponseConverterV4,
  QBooleanParam,
  QComplexParam,
  QDateParam,
  QDateTimeOffsetParam,
  QDateTimeOffsetV2Param,
  QDateTimeV2Param,
  QEnumParam,
  QFunction,
  QGuidParam,
  QGuidV2Param,
  QNumberParam,
  QNumericEnumParam,
  QStringParam,
  QTimeOfDayParam,
  QTimeV2Param,
} from "../../../src";
import { BookModel, QBook } from "./BookModel";

export enum TestFeatures {
  A = "A",
  B = "B",
  C = "C",
}

export enum TestRatings {
  NONE,
  TOP,
  BAD = 50,
  WORSt = 99,
}

export interface BestBookParamModel {
  testNumber: number;
  testBoolean: number;
  testString: PrefixModel;
  testGuid: string;
  "test/Date"?: string | null;
  testTime?: string | null;
  testDateTimeOffset?: string | null;
  testCollection?: Array<string>;
  testEntity?: BookModel | null;
  testEnum?: TestFeatures;
  testNumericEnum?: Array<TestRatings>;
}

export class QBestBookFunction extends QFunction<BestBookParamModel, ODataModelResponseV4<BookModel>> {
  private readonly params = [
    new QNumberParam("TestNumber", "testNumber"),
    new QBooleanParam("test_Boolean", "testBoolean", booleanToNumberConverter),
    new QStringParam("testString", undefined, stringToPrefixModelConverter),
    new QGuidParam("testGuid"),
    new QDateParam("test/Date"),
    new QTimeOfDayParam("testTime"),
    new QDateTimeOffsetParam("testDateTimeOffset"),
    new QStringParam("testCollection"),
    new QComplexParam("TEST_ENTITY", new QBook(), "testEntity"),
    new QEnumParam("testEnum"),
    new QNumericEnumParam(TestRatings, "testNumericEnum"),
  ];

  constructor() {
    super("BestBook", new ModelResponseConverterV4(new QBook()));
  }

  public getParams() {
    return this.params;
  }
}

export interface BestBookParamModelV2 {
  testGuid: string;
  testDateTime: string;
  testDateTimeOffset?: string | null;
  testTime?: string | null;
  testBoolean?: string | null;
  testString?: string | null;
}

export class QBestBookFunctionV2 extends QFunction<BestBookParamModelV2, ODataEntityModelResponseV2<BookModel>> {
  private readonly params = [
    new QGuidV2Param("testGuid"),
    new QDateTimeV2Param("testDateTime"),
    new QDateTimeOffsetV2Param("testDateTimeOffset"),
    new QTimeV2Param("testTime"),
    new QBooleanParam("testBoolean"),
    new QStringParam("testString"),
  ];

  constructor() {
    super("BestBook", new EntityResponseConverterV2<BookModel>(new QBook()), { v2Mode: true });
  }

  public getParams() {
    return this.params;
  }
}
