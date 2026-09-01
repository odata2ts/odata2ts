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

    // CAP answers a patch with the entity, ASP.NET with 204 - the status is not what this pins down
    expect([200, 204]).toContain(result.status);
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

  test("a real 412 forgets the ETag it disproved, so the next write is refused instead of failing again", async () => {
    // two clients of their own, so the ETag store under test is not the one the rest of the suite shares
    const mine = new LibraryService(new FetchClient(), BASE_URL);
    const someoneElse = new LibraryService(new FetchClient(), BASE_URL);

    // I read the copy, which fills my store with the ETag current at that moment
    expect((await mine.Copies(COPY).query().execute()).status).toBe(200);

    // somebody else changes it behind my back, so my ETag is now stale
    const theirWrite = await someoneElse.Copies(COPY).patch({ Condition: 4 }).ignoreETag().execute();
    expect([200, 204]).toContain(theirWrite.status);

    // my write carries the stale ETag and the server refuses it
    const conflict = await expectODataError(mine.Copies(COPY).patch({ Condition: 5 }).execute(), {
      status: 412,
      message: /.*/,
    });
    expect(isConcurrencyConflict(conflict)).toBe(true);

    // and now the point: the disproved ETag is gone, so the retry never reaches the server
    await expect(mine.Copies(COPY).patch({ Condition: 5 }).execute()).rejects.toThrow(ODataConcurrencyError);

    // reading again is what makes writing possible once more
    expect((await mine.Copies(COPY).query().execute()).status).toBe(200);
    expect([200, 204]).toContain((await mine.Copies(COPY).patch({ Condition: 5 }).execute()).status);
  });

  test("ignoreETag writes past whatever is current", async () => {
    const result = await LIBRARY.Copies(COPY).patch({ Condition: 6 }).ignoreETag().execute();

    expect([200, 204]).toContain(result.status);
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
    expect([200, 204]).toContain(result.status);
  });

  test("blindConcurrencyWrites writes without any read at all", async () => {
    const blind = new LibraryService(new FetchClient(undefined, { blindConcurrencyWrites: true }), BASE_URL);

    const result = await blind.Copies(COPY).patch({ Condition: 2 }).execute();

    expect([200, 204]).toContain(result.status);
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

  test("AssessCondition, an action bound to the entity, carries the ETag the preceding read filled in", async () => {
    const result = await LIBRARY.Copies(COPY).AssessCondition({ NewCondition: 5 }).execute();

    expect(result.status).toBe(200);
  });

  test("without a prior read, the bound action is refused before a request is sent", async () => {
    const untouched = new LibraryService(new FetchClient(), BASE_URL);

    await expect(untouched.Copies(COPY).AssessCondition({ NewCondition: 5 }).execute()).rejects.toThrow(
      ODataConcurrencyError,
    );
  });
});
