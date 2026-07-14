import type { ODataValueResponseV2 } from "@odata2ts/odata-core";
import { QFunction } from "@odata2ts/odata-query-objects";

export class QMinFunction extends QFunction<undefined, ODataValueResponseV2<string>> {
  private readonly params: [] = [];

  constructor() {
    super("MinFunction", undefined, { v2Mode: true });
  }

  getParams() {
    return this.params;
  }

  buildUrl(notEncoded = false) {
    return super.buildUrl(undefined, notEncoded);
  }
}
