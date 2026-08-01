import { FetchClient } from "@odata2ts/http-client-fetch";
import { inject } from "vitest";
import { LibraryService } from "../src-generated/library/LibraryService.js";

/** Base URL of the running server, provided by `globalSetup` (container or external server). */
export const BASE_URL = inject("libraryBaseUrl");
export const ODATA_CLIENT = new FetchClient();
export const LIBRARY = new LibraryService(ODATA_CLIENT, BASE_URL);

// Fixed keys from the server's seed data.

/** "Der Prozess" - a book with fixed, well-known values. */
export const BOOK_DER_PROZESS = "11111111-1111-1111-1111-111111111111";
export const AUDIOBOOK = "22222222-2222-2222-2222-222222222222";
export const EBOOK = "33333333-3333-3333-3333-333333333333";
export const UNKNOWN_ID = "00000000-0000-0000-0000-000000000000";

/** The two branches, used as the two ends of a re-binding. */
export const BRANCH_CENTRAL = 1;
export const BRANCH_SUBURBAN = 2;
