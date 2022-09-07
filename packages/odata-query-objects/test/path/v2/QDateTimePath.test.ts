import { QDateTimeV2Path } from "../../../src";
import {
  EXAMPLE_DATE_TIME,
  createBaseDateTimeTests,
  createDateFunctionTests,
  createTimeFunctionTests,
} from "./DateTimeBaseTests";

describe("QDateTimeV2Path test", () => {
  const exampleResult = `datetime'${EXAMPLE_DATE_TIME}'`;

  createBaseDateTimeTests(QDateTimeV2Path, EXAMPLE_DATE_TIME, exampleResult);
  createDateFunctionTests(QDateTimeV2Path);
  createTimeFunctionTests(QDateTimeV2Path);

  test("get URL conform value", () => {
    expect(QDateTimeV2Path.getUrlConformValue(EXAMPLE_DATE_TIME)).toBe(exampleResult);
    expect(QDateTimeV2Path.getUrlConformValue(null)).toBe("null");
    expect(QDateTimeV2Path.getUrlConformValue(undefined)).toBeUndefined();
  });

  test("parse URL conform value", () => {
    expect(QDateTimeV2Path.parseValueFromUrl(exampleResult)).toBe(EXAMPLE_DATE_TIME);
    expect(QDateTimeV2Path.parseValueFromUrl("null")).toBeNull();
    expect(QDateTimeV2Path.parseValueFromUrl(undefined)).toBeUndefined();
  });
});
