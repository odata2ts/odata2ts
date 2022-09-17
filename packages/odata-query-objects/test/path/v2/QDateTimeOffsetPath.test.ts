import { QDateTimeOffsetV2Path } from "../../../src";
import {
  EXAMPLE_DATE_TIME_OFFSET,
  EXAMPLE_PATH_NAME,
  createBaseDateTimeTests,
  createDateFunctionTests,
  createTimeFunctionTests,
} from "./DateTimeBaseTests";

describe("QDateTimeOffsetV2Path test", () => {
  const toTest = new QDateTimeOffsetV2Path(EXAMPLE_PATH_NAME);
  const exampleResult = `datetimeoffset'${EXAMPLE_DATE_TIME_OFFSET}'`;

  test("fails with null, undefined, empty string", () => {
    // @ts-expect-error
    expect(() => new QDateTimeOffsetV2Path(null)).toThrow();
    // @ts-expect-error
    expect(() => new QDateTimeOffsetV2Path()).toThrow();
    // @ts-expect-error
    expect(() => new QDateTimeOffsetV2Path(undefined)).toThrow();
    expect(() => new QDateTimeOffsetV2Path("")).toThrow();
    expect(() => new QDateTimeOffsetV2Path(" ")).toThrow();
  });

  createBaseDateTimeTests(toTest, EXAMPLE_DATE_TIME_OFFSET, exampleResult);
  createDateFunctionTests(toTest);
  createTimeFunctionTests(toTest);
});
