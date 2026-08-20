import { FetchClient } from "@odata2ts/http-client-fetch";
import { inject } from "vitest";
import { LibraryAsV4Service } from "../src-generated/library-as-v4/index.js";
import { LibraryStrictService } from "../src-generated/library-strict/index.js";
import { LibraryService } from "../src-generated/library/index.js";

/** Base URL of the running server, provided by `globalSetup` (container or external server). */
export const BASE_URL = inject("libraryBaseUrl");
export const ODATA_CLIENT = new FetchClient();
export const LIBRARY = new LibraryService(ODATA_CLIENT, BASE_URL);
/** Same server, same model, but every response reshaped as V4 - see `feature/V2ResponseAsV4.test.ts`. */
export const LIBRARY_AS_V4 = new LibraryAsV4Service(ODATA_CLIENT, BASE_URL);

/**
 * The same service through the client generated with `managedPropertyMode: "strictOmit"`. Only
 * `feature/ImmutableProperties.test.ts` uses it: everywhere else the default `lenient` shape applies,
 * which is what makes the difference between the two observable at all.
 */
export const LIBRARY_STRICT = new LibraryStrictService(ODATA_CLIENT, BASE_URL);

// Fixed keys from the server's in-memory seed data (`data/SeedData.java` in test-server-olingo-v2).
// They deliberately match test-server-cap wherever the same entity exists in both.

/** "Der Prozess" - a book with fixed, well-known values. */
export const BOOK_DER_PROZESS = "11111111-1111-1111-1111-111111111111";
export const BOOK_HOBBIT = "11111111-1111-1111-1111-111111111114";
export const UNKNOWN_ID = "00000000-0000-0000-0000-000000000000";

/** Four levels down the hierarchy: TradeJournal -> Magazine -> PrintMedium -> Medium. */
export const TRADE_JOURNAL_NATURE = "33333333-3333-3333-3333-333333333331";
export const AUDIOBOOK_ODYSSEE = "44444444-4444-4444-4444-444444444441";

/** Media link entries: the entity's own content, addressed as .../$value. */
export const EBOOK_CLEAN_CODE = "66666666-6666-6666-6666-666666666661";
export const AUDIOBOOK_CHAPTER = 1;

/** The copy carrying the concurrency token. */
export const COPY_KEY = { MediumId: BOOK_DER_PROZESS, InventoryNumber: 1001 };

/** A copy of a DVD - the case the table-per-leaf-class layout cannot navigate back from. */
export const DVD_METROPOLIS = "55555555-5555-5555-5555-555555555551";
export const DVD_COPY_KEY = { MediumId: DVD_METROPOLIS, InventoryNumber: 1007 };

/** An open loan, used by the entity-returning action `Renew`. */
export const LOAN_OPEN = "bbbbbbbb-0000-0000-0000-000000000001";
