import type { ODataCollectionResponseV4 } from "@odata2ts/odata-core";
import { QFunction } from "@odata2ts/odata-query-objects";

export class QTestFunction extends QFunction<undefined, ODataCollectionResponseV4<string>> {
  private readonly params: [] = [];

  constructor() {
    super("TestFunction");
  }

  getParams() {
    return this.params;
  }

  buildUrl(notEncoded = false) {
    return super.buildUrl(undefined, notEncoded);
  }
}
