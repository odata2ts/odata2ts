import { FetchClient } from "@odata2ts/http-client-fetch";
import { inject } from "vitest";
import { LibraryStrictService } from "../src-generated/library-strict/LibraryStrictService.js";
import { LibraryService } from "../src-generated/library/LibraryService.js";

/** Base URL of the running server, provided by `globalSetup` (container or external server). */
export const BASE_URL = inject("libraryBaseUrl");
export const ODATA_CLIENT = new FetchClient();
export const LIBRARY = new LibraryService(ODATA_CLIENT, BASE_URL);

/**
 * The same service through the client generated with `managedPropertyMode: "strictOmit"`. Only
 * `ImmutableProperties.test.ts` uses it: everywhere else the default `lenient` shape applies, which is
 * what makes the difference between the two observable at all.
 */
export const LIBRARY_STRICT = new LibraryStrictService(ODATA_CLIENT, BASE_URL);

// Fixed keys from the seed data (`db/data/*.csv` in the test-server-cap repo).

/** "Der Prozess" - a book with fixed, well-known values. */
export const BOOK_DER_PROZESS = "11111111-1111-1111-1111-111111111111";
export const UNKNOWN_ID = "00000000-0000-0000-0000-000000000000";

/** Carriers of binary content: a named stream property (`Sample`) and CAP's take on a media entity. */
export const AUDIOBOOK = "44444444-4444-4444-4444-444444444441";
export const EBOOK = "66666666-6666-6666-6666-666666666661";
