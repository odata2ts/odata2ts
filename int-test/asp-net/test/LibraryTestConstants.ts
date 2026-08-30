import { FetchClient } from "@odata2ts/http-client-fetch";
import { inject } from "vitest";
import { LibraryRenamedService } from "../src-generated/library-renamed/LibraryRenamedService.js";
import { LibraryStrictService } from "../src-generated/library-strict/LibraryStrictService.js";
import { LibraryService } from "../src-generated/library/LibraryService.js";

/** Base URL of the running server, provided by `globalSetup` (container or external server). */
export const BASE_URL = inject("libraryBaseUrl");
export const ODATA_CLIENT = new FetchClient();
export const LIBRARY = new LibraryService(ODATA_CLIENT, BASE_URL);

/**
 * The very same service, through the client generated with `allowRenaming`. Only `Renaming.test.ts` uses
 * it: everywhere else the names are the server's own, which is what makes the mapping observable at all.
 */
export const LIBRARY_RENAMED = new LibraryRenamedService(ODATA_CLIENT, BASE_URL);

/**
 * The same service through the client generated with `managedPropertyMode: "strictOmit"`. Only
 * `ImmutableProperties.test.ts` uses it: everywhere else the default `lenient` shape applies, which is
 * what makes the difference between the two observable at all.
 */
export const LIBRARY_STRICT = new LibraryStrictService(ODATA_CLIENT, BASE_URL);

// Fixed keys from the server's seed data.

/** "Der Prozess" - a book with fixed, well-known values. */
export const BOOK_DER_PROZESS = "11111111-1111-1111-1111-111111111111";
/** Its ISBN, declared as `Core.AlternateKeys` on `PrintMedium` - see feature/Annotations.test.ts. */
export const BOOK_DER_PROZESS_ISBN = "9783518188002";
export const AUDIOBOOK = "22222222-2222-2222-2222-222222222222";
export const EBOOK = "33333333-3333-3333-3333-333333333333";
export const UNKNOWN_ID = "00000000-0000-0000-0000-000000000000";

/** The two branches, used as the two ends of a re-binding. */
export const BRANCH_CENTRAL = 1;
export const BRANCH_SUBURBAN = 2;
