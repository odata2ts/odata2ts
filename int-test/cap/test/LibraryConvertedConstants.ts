import { LibraryConvertedService } from "../src-generated/library-converted/LibraryConvertedService.js";
import { BASE_URL, ODATA_CLIENT } from "./LibraryTestConstants.js";

/**
 * The very same service, through the client generated with converters and `v4BigNumberAsString`. Only
 * `feature/Converters.test.ts` uses it - everywhere else the raw client shows what the server really sends,
 * and having both side by side is what makes the conversion observable at all.
 */
export const CONVERTED = new LibraryConvertedService(ODATA_CLIENT, BASE_URL);
