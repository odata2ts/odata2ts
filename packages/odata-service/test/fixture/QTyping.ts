import { QFunction, QParam, QStringParam } from "@odata2ts/odata-query-objects";

import { TypingId } from "./TypingModel";

/**
 * Exactly the same for V2 and V4 as long as no version specific params are used.
 */
export class QTypingIdFunction extends QFunction<TypingId> {
  constructor(path: string) {
    super(path, "Typing");
  }

  getParams() {
    return [new QStringParam("ID", "id")];
  }
}
