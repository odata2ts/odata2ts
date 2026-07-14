import type { ODataValueResponseV2 } from "@odata2ts/odata-core";
import { QFunctionV2 } from "@odata2ts/odata-query-objects";

export class QMinFunction extends QFunctionV2<undefined, ODataValueResponseV2<string>> {
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
