import type { ODataValueResponseV4 } from "@odata2ts/odata-core";
import { QFunction } from "@odata2ts/odata-query-objects";

export class QMinFunction extends QFunction<undefined, ODataValueResponseV4<string>> {
  private readonly params: [] = [];

  constructor() {
    super("MinFunction");
  }

  getParams() {
    return this.params;
  }

  buildUrl(notEncoded = false) {
    return super.buildUrl(undefined, notEncoded);
  }
}
