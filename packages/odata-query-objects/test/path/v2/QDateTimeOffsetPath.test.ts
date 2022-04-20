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
});
