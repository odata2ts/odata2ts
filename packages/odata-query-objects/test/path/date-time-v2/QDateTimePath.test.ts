import { QDateTimePath } from "../../../src/v2";
import {
  EXAMPLE_DATE_TIME,
  createBaseDateTimeTests,
  createDateFunctionTests,
  createTimeFunctionTests,
} from "./DateTimeBaseTests";

describe("QDateTimePath test", () => {
  const exampleResult = `datetime'${EXAMPLE_DATE_TIME}'`;

  createBaseDateTimeTests(QDateTimePath, EXAMPLE_DATE_TIME, exampleResult);
  createDateFunctionTests(QDateTimePath);
  createTimeFunctionTests(QDateTimePath);
});
