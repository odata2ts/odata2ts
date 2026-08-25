import { FetchClient } from "@odata2ts/http-client-fetch";
import { isConcurrencyConflict, isConcurrencyRequired, ODataConcurrencyError } from "@odata2ts/odata-service";
import { beforeEach, describe, expect, expectTypeOf, test } from "vitest";
import { LibraryService } from "../../src-generated/library/index.js";
import { expectODataError } from "../expectODataError.js";
import { BASE_URL, BOOK_DER_PROZESS, LIBRARY, LIBRARY_STRICT } from "../LibraryTestConstants.js";

/**
 * Optimistic concurrency against CAP, which announces it as `Core.OptimisticConcurrency` on the `Copies`
 * entity set - externally, targeting the entity container, and with an empty collection. That empty
 * collection is the point of running this against CAP specifically: the term names no property, and the
 * client needs none, since the value always arrives in the response.
 *
 * The counterpart files are in `int-test/asp-net` (inline annotation, property named) and
 * `int-test/olingo-v2` (no annotation at all - the V2 `ConcurrencyMode` facet).
 */
describe("CAP Library: optimistic concurrency", () => {
  const COPY = { MediumId: BOOK_DER_PROZESS, InventoryNumber: 1001 };

  /** Reads the copy through the regular client, which fills the ETag store as a side effect. */
  async function readCopy() {
    const result = await LIBRARY.Copies(COPY).query().execute();
    expect(result.status).toBe(200);
    return result;
  }

  beforeEach(async () => {
    // every test starts from a known ETag; the store is shared with the other suites through the client
    await readCopy();
  });

  test("a read hands the ETag over, and the following write carries it", async () => {
    const result = await LIBRARY.Copies(COPY).patch({ Condition: 7 }).execute();

    expect(result.status).toBe(204);
    expectTypeOf(result.data).toEqualTypeOf<undefined>();
  });

  test("the response really did state an ETag", async () => {
    const result = await readCopy();

    // CAP states it both ways; either is enough for the client
    const stated = result.headers["etag"] ?? (result.data as unknown as Record<string, string>)["@odata.etag"];
    expect(stated).toBeTruthy();
  });

  test("writing without ever reading is refused before a request is sent", async () => {
    // a service built on a client of its own knows nothing yet
    const untouched = new LibraryService(new FetchClient(), BASE_URL);

    await expect(untouched.Copies(COPY).patch({ Condition: 7 }).execute()).rejects.toThrow(ODataConcurrencyError);
  });

  test("a stale ETag is refused by the server", async () => {
    const error = await expectODataError(LIBRARY.Copies(COPY).patch({ Condition: 8 }).withETag('W/"stale"').execute(), {
      status: 412,
      message: /.*/,
    });

    expect(isConcurrencyConflict(error)).toBe(true);
    expect(isConcurrencyRequired(error)).toBe(false);
  });

  test("ignoreETag writes past whatever is current", async () => {
    const result = await LIBRARY.Copies(COPY).patch({ Condition: 6 }).ignoreETag().execute();

    expect(result.status).toBe(204);
  });

  test("a second write without re-reading is refused, since the first made the ETag stale", async () => {
    await LIBRARY.Copies(COPY).patch({ Condition: 5 }).execute();

    await expect(LIBRARY.Copies(COPY).patch({ Condition: 4 }).execute()).rejects.toThrow(ODataConcurrencyError);
  });

  test("reading the collection is enough to write to one of its rows", async () => {
    // the flow the store exists for: list, then edit a row without reading that row again
    const fresh = new LibraryService(new FetchClient(), BASE_URL);
    const list = await fresh
      .Copies()
      .query((b, q) => b.filter(q.MediumId.eq(COPY.MediumId)))
      .execute();
    expect(list.data.value.length).toBeGreaterThan(0);

    const result = await fresh.Copies(COPY).patch({ Condition: 3 }).execute();
    expect(result.status).toBe(204);
  });

  test("blindConcurrencyWrites writes without any read at all", async () => {
    const blind = new LibraryService(new FetchClient(undefined, { blindConcurrencyWrites: true }), BASE_URL);

    const result = await blind.Copies(COPY).patch({ Condition: 2 }).execute();

    expect(result.status).toBe(204);
  });

  test("with the evaluation switched off the server answers 428", async () => {
    // `libraryStrict` is generated with `annotations.disableOptimisticConcurrency`, so nothing is marked
    // as controlled and no `If-Match` is ever sent - which is precisely what CAP refuses
    const error = await expectODataError(LIBRARY_STRICT.Copies(COPY).patch({ Condition: 9 }).execute(), {
      status: 428,
      message: /.*/,
    });

    expect(isConcurrencyRequired(error)).toBe(true);
  });

  test("the ETag store does not leak into a client that never read", async () => {
    const other = new LibraryService(new FetchClient(), BASE_URL);

    await expect(other.Copies(COPY).delete().execute()).rejects.toThrow(ODataConcurrencyError);
  });
});
