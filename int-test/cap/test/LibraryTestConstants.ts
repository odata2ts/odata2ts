import { FetchClient } from "@odata2ts/http-client-fetch";
import { inject } from "vitest";
import { LibraryService } from "../src-generated/library/LibraryService";

/** Base URL of the running server, provided by `globalSetup` (container or external server). */
export const BASE_URL = inject("libraryBaseUrl");
export const ODATA_CLIENT = new FetchClient();
export const LIBRARY = new LibraryService(ODATA_CLIENT, BASE_URL);

// Fixed keys from the seed data (`db/data/*.csv` in the test-server-cap repo).

/** "Der Prozess" - a book with fixed, well-known values. */
export const BOOK_DER_PROZESS = "11111111-1111-1111-1111-111111111111";
export const UNKNOWN_ID = "00000000-0000-0000-0000-000000000000";
