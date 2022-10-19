import { FIXED_DATE, FIXED_STRING, fixedDateConverter } from "@odata2ts/test-converters";

import { QTimeV2Path } from "../../../src";
import { EXAMPLE_PATH_NAME, EXAMPLE_TIME, createBaseDateTimeTests, createTimeFunctionTests } from "./DateTimeBaseTests";

describe("QTimeV2Path test", () => {
  const toTest = new QTimeV2Path(EXAMPLE_PATH_NAME);
  const exampleResult = `time'${EXAMPLE_TIME}'`;

  test("fails with null, undefined, empty string", () => {
    // @ts-expect-error
    expect(() => new QTimeV2Path(null)).toThrow();
    // @ts-expect-error
    expect(() => new QTimeV2Path()).toThrow();
    // @ts-expect-error
    expect(() => new QTimeV2Path(undefined)).toThrow();
    expect(() => new QTimeV2Path("")).toThrow();
    expect(() => new QTimeV2Path(" ")).toThrow();
  });

  test("with converter", () => {
    const testWithConv = new QTimeV2Path(EXAMPLE_PATH_NAME, fixedDateConverter);

    expect(testWithConv.gt(FIXED_DATE).toString()).toBe(`createdAt gt time'${FIXED_STRING}'`);
  });

  createBaseDateTimeTests(toTest, EXAMPLE_TIME, exampleResult);
  createTimeFunctionTests(toTest);
});
