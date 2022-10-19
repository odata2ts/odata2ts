import { FIXED_DATE, FIXED_STRING, fixedDateConverter } from "@odata2ts/test-converters";

import { QDatePath } from "../../../src";
import {
  EXAMPLE_DATE,
  EXAMPLE_PATH_NAME,
  createBaseDateTimeTests,
  createDateFunctionTests,
} from "../v4/DateTimeBaseTests";

describe("QDatePath test", () => {
  const toTest = new QDatePath(EXAMPLE_PATH_NAME);

  test("fails with null, undefined, empty string", () => {
    // @ts-expect-error
    expect(() => new QDatePath(null)).toThrow();
    // @ts-expect-error
    expect(() => new QDatePath()).toThrow();
    // @ts-expect-error
    expect(() => new QDatePath(undefined)).toThrow();
    expect(() => new QDatePath("")).toThrow();
    expect(() => new QDatePath(" ")).toThrow();
  });

  test("with converter", () => {
    const testWithConv = new QDatePath(EXAMPLE_PATH_NAME, fixedDateConverter);

    expect(testWithConv.gt(FIXED_DATE).toString()).toBe(`${EXAMPLE_PATH_NAME} gt ${FIXED_STRING}`);
  });

  createBaseDateTimeTests(toTest, EXAMPLE_DATE);
  createDateFunctionTests(toTest);
});
