import { QFunction } from "@odata2ts/odata-query-objects";

export class QEmptyFunction extends QFunction {
  private readonly params: [] = [];

  constructor() {
    super("EmptyFunction");
  }

  getParams() {
    return this.params;
  }

  buildUrl(notEncoded = false) {
    return super.buildUrl(undefined, notEncoded);
  }
}
