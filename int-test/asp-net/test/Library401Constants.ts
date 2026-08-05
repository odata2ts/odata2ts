import { Library401Service } from "../src-generated/library-401/Library401Service.js";
import { BASE_URL, ODATA_CLIENT } from "./LibraryTestConstants.js";

/**
 * The very same service, through the client generated with `odataVersionV4: "4.01"`. Only
 * `feature/ODataVersion401.test.ts` uses it - the difference to the default 4.0 client is entirely in the
 * payloads, so it is only observable next to that one.
 */
export const LIBRARY_401 = new Library401Service(ODATA_CLIENT, BASE_URL);
