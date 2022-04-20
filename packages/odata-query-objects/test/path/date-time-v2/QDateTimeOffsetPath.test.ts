import { QDateTimeOffsetPath } from "../../../src/v2";
import {
  EXAMPLE_DATE_TIME_OFFSET,
  createBaseDateTimeTests,
  createDateFunctionTests,
  createTimeFunctionTests,
} from "./DateTimeBaseTests";

describe("QDateTimeOffsetPath test", () => {
  const exampleResult = `datetimeoffset'${EXAMPLE_DATE_TIME_OFFSET}'`;

  createBaseDateTimeTests(QDateTimeOffsetPath, EXAMPLE_DATE_TIME_OFFSET, exampleResult);
  createDateFunctionTests(QDateTimeOffsetPath);
  createTimeFunctionTests(QDateTimeOffsetPath);
});
