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
});
