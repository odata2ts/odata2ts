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

  createBaseDateTimeTests(toTest, EXAMPLE_TIME);
  createTimeFunctionTests(toTest);
});
