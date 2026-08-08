import { LibraryRenamedService } from "../src-generated/library-renamed/index.js";
import { BASE_URL, ODATA_CLIENT } from "./LibraryTestConstants.js";

/**
 * The very same service, through the client generated with `allowRenaming`. Only `feature/Renaming.test.ts`
 * uses it - everywhere else the names are the server's own, and having both forms side by side is what makes
 * the mapping observable at all.
 */
export const RENAMED = new LibraryRenamedService(ODATA_CLIENT, BASE_URL);
