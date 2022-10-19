import { FIXED_DATE, FIXED_STRING, fixedDateConverter } from "@odata2ts/test-converters";

import { QTimeOfDayPath } from "../../../src";
import { EXAMPLE_PATH_NAME, EXAMPLE_TIME, createBaseDateTimeTests, createTimeFunctionTests } from "./DateTimeBaseTests";

describe("QTimeOfDayPath test", () => {
  const toTest = new QTimeOfDayPath(EXAMPLE_PATH_NAME);

  test("fails with null, undefined, empty string", () => {
    // @ts-expect-error
    expect(() => new QTimeOfDayPath(null)).toThrow();
    // @ts-expect-error
    expect(() => new QTimeOfDayPath()).toThrow();
    // @ts-expect-error
    expect(() => new QTimeOfDayPath(undefined)).toThrow();
    expect(() => new QTimeOfDayPath("")).toThrow();
    expect(() => new QTimeOfDayPath(" ")).toThrow();
  });

  test("with converter", () => {
    const testWithConv = new QTimeOfDayPath(EXAMPLE_PATH_NAME, fixedDateConverter);

    expect(testWithConv.gt(FIXED_DATE).toString()).toBe(`${EXAMPLE_PATH_NAME} gt ${FIXED_STRING}`);
  });

  createBaseDateTimeTests(toTest, EXAMPLE_TIME);
  createTimeFunctionTests(toTest);
});
