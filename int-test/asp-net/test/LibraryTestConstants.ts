import { FetchClient } from "@odata2ts/http-client-fetch";
import { inject } from "vitest";
import { LibraryJsonBatchService } from "../src-generated/library-json-batch/LibraryJsonBatchService.js";
import { LibraryNamespaceAliasService } from "../src-generated/library-namespace-alias/LibraryNamespaceAliasService.js";
import { LibraryRenamedService } from "../src-generated/library-renamed/LibraryRenamedService.js";
import { LibraryStrictService } from "../src-generated/library-strict/LibraryStrictService.js";
import { LibraryService } from "../src-generated/library/LibraryService.js";
import { CollisionCatalogService } from "../src-generated/namespace-collision-catalog/CollisionCatalogService.js";
import { CollisionRegistryService } from "../src-generated/namespace-collision-registry/CollisionRegistryService.js";

/** Base URL of the running server, provided by `globalSetup` (container or external server). */
export const BASE_URL = inject("libraryBaseUrl");
export const ODATA_CLIENT = new FetchClient();
export const LIBRARY = new LibraryService(ODATA_CLIENT, BASE_URL);

/**
 * The very same service through a client generated with `batch: { format: "json" }` - the one whose `$batch`
 * builder carries the JSON wire format plus numeric `dependsOn`. Only `Batch.test.ts` uses it: the default
 * `LIBRARY` is the multipart client.
 */
export const LIBRARY_JSON_BATCH = new LibraryJsonBatchService(ODATA_CLIENT, BASE_URL);

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

/**
 * The same service through the client generated with namespace aliasing switched on. Only
 * `NamespaceAlias.test.ts` uses it: everywhere else the raw namespace is what a cache-key literal carries.
 */
export const LIBRARY_NAMESPACE_ALIAS = new LibraryNamespaceAliasService(ODATA_CLIENT, BASE_URL);

/**
 * The two synthetic `cacheKeys.namespace` clients - models no server in this workspace serves. Only
 * `CacheKeys.test.ts` uses them, and only client-side: the collision assertion reads the cache keys the
 * generated code builds locally, so nothing is ever executed against a URL.
 */
export const COLLISION_CATALOG = new CollisionCatalogService(ODATA_CLIENT, BASE_URL);
export const COLLISION_REGISTRY = new CollisionRegistryService(ODATA_CLIENT, BASE_URL);

// Fixed keys from the server's seed data.

/** "Der Prozess" - a book with fixed, well-known values. */
export const BOOK_DER_PROZESS = "11111111-1111-1111-1111-111111111111";
/** Its ISBN, declared as `Core.AlternateKeys` on `PrintMedium` - see feature/Annotations.test.ts. */
export const BOOK_DER_PROZESS_ISBN = "9783518188002";
export const AUDIOBOOK = "22222222-2222-2222-2222-222222222222";
export const EBOOK = "33333333-3333-3333-3333-333333333333";
export const MAGAZINE = "44444444-4444-4444-4444-444444444444";
export const TRADE_JOURNAL = "55555555-5555-5555-5555-555555555555";
export const DVD = "66666666-6666-6666-6666-666666666666";
export const COLLECTORS_ITEM = "77777777-7777-7777-7777-777777777777";
export const UNKNOWN_ID = "00000000-0000-0000-0000-000000000000";

/** The two branches, used as the two ends of a re-binding. */
export const BRANCH_CENTRAL = 1;
export const BRANCH_SUBURBAN = 2;
