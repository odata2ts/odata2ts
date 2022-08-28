import { QDateTimeOffsetV2Path } from "../../../src";
import {
  EXAMPLE_DATE_TIME_OFFSET,
  createBaseDateTimeTests,
  createDateFunctionTests,
  createTimeFunctionTests,
} from "./DateTimeBaseTests";

describe("QDateTimeOffsetV2Path test", () => {
  const exampleResult = `datetimeoffset'${EXAMPLE_DATE_TIME_OFFSET}'`;

  createBaseDateTimeTests(QDateTimeOffsetV2Path, EXAMPLE_DATE_TIME_OFFSET, exampleResult);
  createDateFunctionTests(QDateTimeOffsetV2Path);
  createTimeFunctionTests(QDateTimeOffsetV2Path);

  test("get URL conform value", () => {
    expect(QDateTimeOffsetV2Path.getUrlConformValue(EXAMPLE_DATE_TIME_OFFSET)).toBe(exampleResult);
    expect(QDateTimeOffsetV2Path.getUrlConformValue(null)).toBe("null");
    expect(QDateTimeOffsetV2Path.getUrlConformValue(undefined)).toBeUndefined();
  });

  test("parse URL conform value", () => {
    expect(QDateTimeOffsetV2Path.parseValueFromUrl(exampleResult)).toBe(EXAMPLE_DATE_TIME_OFFSET);
    expect(QDateTimeOffsetV2Path.parseValueFromUrl("null")).toBeNull();
    expect(QDateTimeOffsetV2Path.parseValueFromUrl(undefined)).toBeUndefined();
  });
});
