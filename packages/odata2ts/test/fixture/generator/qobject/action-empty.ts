import { QAction } from "@odata2ts/odata-query-objects";

export class QTestAction extends QAction<undefined> {
  private readonly params: [] = [];

  constructor() {
    super("TestAction");
  }

  getParams() {
    return this.params;
  }
}
