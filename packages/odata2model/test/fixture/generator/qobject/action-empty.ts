import { QAction } from "@odata2ts/odata-query-objects";

export class QEmptyAction extends QAction {
  private readonly params = [];

  constructor(path: string) {
    super(path, "EmptyAction");
  }

  getParams() {
    return this.params;
  }
}
