import { QDatePath, QDateTimeOffsetPath } from "../../../src";
import {
  EXAMPLE_DATE,
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

  createBaseDateTimeTests(toTest, EXAMPLE_DATE_TIME_OFFSET);
  createDateFunctionTests(toTest);
  createTimeFunctionTests(toTest);
});
