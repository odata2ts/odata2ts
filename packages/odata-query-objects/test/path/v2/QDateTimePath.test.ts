import { FIXED_DATE, FIXED_STRING, fixedDateConverter } from "@odata2ts/test-converters";
import { describe, expect, test } from "vitest";
import { QDateTimeV2Path } from "../../../src";
import {
  createBaseDateTimeTests,
  createDateFunctionTests,
  createTimeFunctionTests,
  EXAMPLE_DATE_TIME,
  EXAMPLE_PATH_NAME,
} from "./DateTimeBaseTests";

/** The same instant as FIXED_STRING, in the timezone-less form V2's `datetime` literal requires. */
const FIXED_STRING_URL = FIXED_STRING.replace(/\.000Z$/, "").replace(/Z$/, "");

describe("QDateTimeV2Path test", () => {
  const toTest = new QDateTimeV2Path(EXAMPLE_PATH_NAME);
  const exampleResult = `datetime'${EXAMPLE_DATE_TIME}'`;

  test("fails with null, undefined, empty string", () => {
    // @ts-expect-error
    expect(() => new QDateTimeV2Path(null)).toThrow();
    // @ts-expect-error
    expect(() => new QDateTimeV2Path()).toThrow();
    // @ts-expect-error
    expect(() => new QDateTimeV2Path(undefined)).toThrow();
    expect(() => new QDateTimeV2Path("")).toThrow();
    expect(() => new QDateTimeV2Path(" ")).toThrow();
  });

  test("with converter", () => {
    const testWithConv = new QDateTimeV2Path(EXAMPLE_PATH_NAME, fixedDateConverter);

    // V2's datetime literal carries no timezone designator, so the converted ISO value is normalised
    expect(testWithConv.gt(FIXED_DATE).toString()).toBe(`createdAt gt datetime'${FIXED_STRING_URL}'`);
  });

  createBaseDateTimeTests(toTest, EXAMPLE_DATE_TIME, exampleResult);
  createDateFunctionTests(toTest);
  createTimeFunctionTests(toTest);
});
