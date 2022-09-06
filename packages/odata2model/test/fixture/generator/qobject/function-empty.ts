import { QFunction } from "@odata2ts/odata-query-objects";

export class QEmptyFunction extends QFunction {
  private readonly params = [];

  constructor(path: string) {
    super(path, "EmptyFunction");
  }

  getParams() {
    return this.params;
  }

  buildUrl() {
    return super.buildUrl(undefined);
  }
}
