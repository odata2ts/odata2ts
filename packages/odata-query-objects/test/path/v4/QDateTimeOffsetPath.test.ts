import { FIXED_DATE, FIXED_STRING, fixedDateConverter } from "@odata2ts/test-converters";

import { QDateTimeOffsetPath } from "../../../src";
import {
  EXAMPLE_DATE_TIME_OFFSET,
  EXAMPLE_PATH_NAME,
  createBaseDateTimeTests,
  createDateFunctionTests,
  createTimeFunctionTests,
} from "./DateTimeBaseTests";

describe("QDateTimeOffsetPath test", () => {
  const toTest = new QDateTimeOffsetPath(EXAMPLE_PATH_NAME);

  test("fails with null, undefined, empty string", () => {
    // @ts-expect-error
    expect(() => new QDateTimeOffsetPath(null)).toThrow();
    // @ts-expect-error
    expect(() => new QDateTimeOffsetPath()).toThrow();
    // @ts-expect-error
    expect(() => new QDateTimeOffsetPath(undefined)).toThrow();
    expect(() => new QDateTimeOffsetPath("")).toThrow();
    expect(() => new QDateTimeOffsetPath(" ")).toThrow();
  });

  test("with converter", () => {
    const testWithConv = new QDateTimeOffsetPath(EXAMPLE_PATH_NAME, fixedDateConverter);

    expect(testWithConv.gt(FIXED_DATE).toString()).toBe(`${EXAMPLE_PATH_NAME} gt ${FIXED_STRING}`);
  });

  createBaseDateTimeTests(toTest, EXAMPLE_DATE_TIME_OFFSET);
  createDateFunctionTests(toTest);
  createTimeFunctionTests(toTest);

  test("date function", () => {
    expect(toTest.date().eq("xxx").toString()).toBe(`date(${EXAMPLE_PATH_NAME}) eq xxx`);
  });

  test("time function", () => {
    expect(toTest.time().eq("xxx").toString()).toBe(`time(${EXAMPLE_PATH_NAME}) eq xxx`);
  });
});
