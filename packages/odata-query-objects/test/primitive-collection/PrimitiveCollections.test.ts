import {
  booleanToNumberConverter,
  numberToStringConverter,
  stringToPrefixModelConverter,
} from "@odata2ts/test-converters";
import { describe, expect, test } from "vitest";
import {
  QBigNumberCollection,
  QBinaryCollection,
  QBooleanCollection,
  QDateCollection,
  QDateTimeOffsetCollection,
  QDateTimeOffsetV2Collection,
  QDateTimeV2Collection,
  QEnumCollection,
  QGuidCollection,
  QGuidV2Collection,
  QNumberCollection,
  QNumberV2Collection,
  QNumericEnumCollection,
  QStringCollection,
  QStringV2Collection,
  QTimeOfDayCollection,
  QTimeV2Collection,
} from "../../src";

function mkPrfx(value: string) {
  return { prefix: "PREFIX_", value: value };
}

describe("PrimitiveCollections tests", () => {
  const PREFIX = "pref";

  const STRING_INPUT = ["A", "b", "Zebra"];
  const CONVERTED_STRING_OUTPUT = STRING_INPUT.map(mkPrfx);
  const NUMBER_INPUT = [1, 5, 99];
  const CONVERTED_NUMBER_OUTPUT = ["1", "5", "99"];
  const BIG_NUMBER_INPUT = ["12345678901234567890", "2", "3"];
  const CONVERTED_BIG_NUMBER_OUTPUT = BIG_NUMBER_INPUT.map(mkPrfx);
  const BOOLEAN_INPUT = [true, false, true];
  const CONVERTED_BOOLEAN_OUTPUT = [1, 0, 1];
  enum StringTestEnum {
    A = "A",
    B = "B",
    Zebra = "Zebra",
  }
  enum NumericTestEnum {
    A,
    B,
    Zebra = 99,
  }
  const ENUM_INPUT = ["B", "Zebra"];

  const STRING_BASED_COLLECTIONS = [
    QStringCollection,
    QStringV2Collection,
    QGuidCollection,
    QGuidV2Collection,
    QDateTimeOffsetCollection,
    QTimeOfDayCollection,
    QDateCollection,
    QTimeV2Collection,
    QDateTimeV2Collection,
    QDateTimeOffsetV2Collection,
  ];

  test("All String based data types", () => {
    STRING_BASED_COLLECTIONS.forEach((CollectionClass) => {
      const t = new CollectionClass();
      expect(t.convertFromOData(STRING_INPUT)).toStrictEqual(STRING_INPUT);
      expect(t.convertToOData(STRING_INPUT)).toStrictEqual(STRING_INPUT);
    });
  });

  test("All String based data types with Converter", () => {
    STRING_BASED_COLLECTIONS.forEach((CollectionClass) => {
      const toTest = new CollectionClass(PREFIX, stringToPrefixModelConverter);

      expect
        .soft(toTest.convertFromOData(STRING_INPUT), `convertFrom with ${CollectionClass.toString()}`)
        .toStrictEqual(CONVERTED_STRING_OUTPUT);
      expect
        .soft(toTest.convertToOData(CONVERTED_STRING_OUTPUT), `convertTo with ${CollectionClass.toString()}`)
        .toStrictEqual(STRING_INPUT);
    });
  });

  test("QNumberCollection", () => {
    const toTest = new QNumberCollection();

    expect(toTest.convertFromOData(NUMBER_INPUT)).toStrictEqual(NUMBER_INPUT);
    expect(toTest.convertToOData(NUMBER_INPUT)).toStrictEqual(NUMBER_INPUT);
  });

  test("QNumberCollection with Converter", () => {
    const toTest = new QNumberCollection(PREFIX, numberToStringConverter);

    expect(toTest.convertFromOData(NUMBER_INPUT)).toStrictEqual(CONVERTED_NUMBER_OUTPUT);
    expect(toTest.convertToOData(CONVERTED_NUMBER_OUTPUT)).toStrictEqual(NUMBER_INPUT);
  });

  test("QNumberV2Collection", () => {
    const toTest = new QNumberV2Collection();

    expect(toTest.convertFromOData(NUMBER_INPUT)).toStrictEqual(NUMBER_INPUT);
    expect(toTest.convertToOData(NUMBER_INPUT)).toStrictEqual(NUMBER_INPUT);
  });

  test("QNumberV2Collection with Converter", () => {
    const toTest = new QNumberV2Collection(PREFIX, numberToStringConverter);

    expect(toTest.convertFromOData(NUMBER_INPUT)).toStrictEqual(CONVERTED_NUMBER_OUTPUT);
    expect(toTest.convertToOData(CONVERTED_NUMBER_OUTPUT)).toStrictEqual(NUMBER_INPUT);
  });

  test("QBigNumberCollection", () => {
    const toTest = new QBigNumberCollection();

    expect(toTest.convertFromOData(BIG_NUMBER_INPUT)).toStrictEqual(BIG_NUMBER_INPUT);
    expect(toTest.convertToOData(BIG_NUMBER_INPUT)).toStrictEqual(BIG_NUMBER_INPUT);
  });

  test("QBigNumberCollection with Converter", () => {
    const toTest = new QBigNumberCollection(PREFIX, stringToPrefixModelConverter);

    expect(toTest.convertFromOData(BIG_NUMBER_INPUT)).toStrictEqual(CONVERTED_BIG_NUMBER_OUTPUT);
    expect(toTest.convertToOData(CONVERTED_BIG_NUMBER_OUTPUT)).toStrictEqual(BIG_NUMBER_INPUT);
  });

  test("QBooleanCollection", () => {
    const toTest = new QBooleanCollection();

    expect(toTest.convertFromOData(BOOLEAN_INPUT)).toStrictEqual(BOOLEAN_INPUT);
    expect(toTest.convertToOData(BOOLEAN_INPUT)).toStrictEqual(BOOLEAN_INPUT);
  });

  test("QBooleanCollection with Converter", () => {
    const toTest = new QBooleanCollection(PREFIX, booleanToNumberConverter);

    expect(toTest.convertFromOData(BOOLEAN_INPUT)).toStrictEqual(CONVERTED_BOOLEAN_OUTPUT);
    expect(toTest.convertToOData(CONVERTED_BOOLEAN_OUTPUT)).toStrictEqual(BOOLEAN_INPUT);
  });

  test("QBooleanCollection with Converter", () => {
    const toTest = new QBinaryCollection();
    expect(toTest.convertFromOData(STRING_INPUT)).toStrictEqual(STRING_INPUT);
    expect(toTest.convertToOData(STRING_INPUT)).toStrictEqual(STRING_INPUT);
  });

  test("QEnumCollection", () => {
    const toTest = new QEnumCollection(StringTestEnum);

    expect(toTest.convertFromOData(ENUM_INPUT)).toStrictEqual([StringTestEnum.B, StringTestEnum.Zebra]);
    expect(toTest.convertToOData([StringTestEnum.B, "Zebra"])).toStrictEqual(ENUM_INPUT);
  });

  test("QNumericEnumCollection", () => {
    const toTest = new QNumericEnumCollection(NumericTestEnum);

    expect(toTest.convertFromOData(ENUM_INPUT)).toStrictEqual([NumericTestEnum.B, NumericTestEnum.Zebra]);
    expect(toTest.convertToOData([NumericTestEnum.B, 99])).toStrictEqual(ENUM_INPUT);
  });
});
