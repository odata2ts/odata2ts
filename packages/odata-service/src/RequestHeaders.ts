import { ODataVersionV4 } from "@odata2ts/odata-core";

const JSON_VALUE = "application/json";
const BIG_NUMBER_FORMAT = `${JSON_VALUE};IEEE754Compatible=true`;

export const DEFAULT_HEADERS = { Accept: JSON_VALUE, "Content-Type": JSON_VALUE };
export const BIG_NUMBERS_HEADERS = { Accept: BIG_NUMBER_FORMAT, "Content-Type": BIG_NUMBER_FORMAT };
export const MERGE_HEADERS = { "X-Http-Method": "MERGE" };

/**
 * The OData version declared for V4 services, which is only done on requests carrying a body: the
 * OData-Version header governs how the service interprets the request payload. It is what makes the
 * notations we generate valid, e.g. `@odata.bind`, which clients must not use when declaring 4.01
 * (see OData JSON Format v4.01, chap. 8.5).
 *
 * Defaults to 4.0, the more widely deployed and the more compatible version. The generator sets 4.01
 * on the main service, if configured accordingly.
 */
export function getODataVersionHeaders(odataVersion: ODataVersionV4 = "4.0") {
  return { "OData-Version": odataVersion };
}
