import { QTimePath } from "../../../src/v2";
import {
  EXAMPLE_TIME,
  createBaseDateTimeTests,
  createDateFunctionTests,
  createTimeFunctionTests,
} from "./DateTimeBaseTests";

describe("QTimePath test", () => {
  const exampleResult = `time'${EXAMPLE_TIME}'`;

  createBaseDateTimeTests(QTimePath, EXAMPLE_TIME, exampleResult);
  createTimeFunctionTests(QTimePath);
});
