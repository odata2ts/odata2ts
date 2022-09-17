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

  createBaseDateTimeTests(toTest, EXAMPLE_DATE);
  createDateFunctionTests(toTest);
});
