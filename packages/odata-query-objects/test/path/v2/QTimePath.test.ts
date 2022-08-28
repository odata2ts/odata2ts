import { QTimeV2Path } from "../../../src";
import { EXAMPLE_TIME, createBaseDateTimeTests, createTimeFunctionTests } from "./DateTimeBaseTests";

describe("QTimeV2Path test", () => {
  const exampleResult = `time'${EXAMPLE_TIME}'`;

  createBaseDateTimeTests(QTimeV2Path, EXAMPLE_TIME, exampleResult);
  createTimeFunctionTests(QTimeV2Path);

  test("get URL conform value", () => {
    expect(QTimeV2Path.getUrlConformValue(EXAMPLE_TIME)).toBe(exampleResult);
    expect(QTimeV2Path.getUrlConformValue(null)).toBe("null");
    expect(QTimeV2Path.getUrlConformValue(undefined)).toBeUndefined();
  });

  test("parse URL conform value", () => {
    expect(QTimeV2Path.parseValueFromUrl(exampleResult)).toBe(EXAMPLE_TIME);
    expect(QTimeV2Path.parseValueFromUrl("null")).toBeNull();
    expect(QTimeV2Path.parseValueFromUrl(undefined)).toBeUndefined();
  });
});
