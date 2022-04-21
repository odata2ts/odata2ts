import { QTimeV2Path } from "../../../src";
import { EXAMPLE_TIME, createBaseDateTimeTests, createTimeFunctionTests } from "./DateTimeBaseTests";

describe("QTimeV2Path test", () => {
  const exampleResult = `time'${EXAMPLE_TIME}'`;

  createBaseDateTimeTests(QTimeV2Path, EXAMPLE_TIME, exampleResult);
  createTimeFunctionTests(QTimeV2Path);
});
