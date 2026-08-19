import { QAction, QStringParam } from "@odata2ts/odata-query-objects";
// @ts-ignore
import type { TestActionParams } from "./TesterModel.js";

export class QTestAction extends QAction<TestActionParams> {
  private readonly params = [new QStringParam("test"), new QStringParam("opt_Test", "optTest")];

  constructor() {
    super("TestAction");
  }

  getParams() {
    return this.params;
  }
}
