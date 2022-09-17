import { QDateTimeV2Path } from "../../../src";
import {
  EXAMPLE_DATE_TIME,
  EXAMPLE_PATH_NAME,
  createBaseDateTimeTests,
  createDateFunctionTests,
  createTimeFunctionTests,
} from "./DateTimeBaseTests";

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

  createBaseDateTimeTests(toTest, EXAMPLE_DATE_TIME, exampleResult);
  createDateFunctionTests(toTest);
  createTimeFunctionTests(toTest);
});
