import { QFunction, QParam, QStringParam } from "@odata2ts/odata-query-objects";

import { PersonId } from "./PersonModel";

/**
 * Exactly the same for V2 and V4 as long as no version specific params are used.
 */
export class QPersonIdFunction extends QFunction<PersonId> {
  getParams() {
    return [new QStringParam("UserName", "userName")];
  }
}
