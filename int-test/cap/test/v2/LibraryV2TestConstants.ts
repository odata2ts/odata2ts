import { FetchClient } from "@odata2ts/http-client-fetch";
import { inject } from "vitest";
import { LibraryV2Service } from "../../src-generated/library-v2/LibraryV2Service.js";

/**
 * Base URL of the V2 endpoint, provided by `globalSetup`. Same server, same data, same process as the V4
 * one - only routed through `@cap-js-community/odata-v2-adapter`.
 */
export const BASE_URL = inject("libraryV2BaseUrl");
export const ODATA_CLIENT = new FetchClient();
export const LIBRARY_V2 = new LibraryV2Service(ODATA_CLIENT, BASE_URL);

// Fixed keys from the seed data (`db/data/*.csv` in the test-server-cap repo) - the same rows the V4
// tests use, since it is one database.

/** "Der Prozess" - a book with fixed, well-known values. */
export const BOOK_DER_PROZESS = "11111111-1111-1111-1111-111111111111";
export const UNKNOWN_ID = "00000000-0000-0000-0000-000000000000";

/** Carriers of binary content: `Audiobook.Sample` and `EBook.content` in the V4 model. */
export const AUDIOBOOK = "44444444-4444-4444-4444-444444444441";
export const EBOOK = "66666666-6666-6666-6666-666666666661";
