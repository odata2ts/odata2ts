import { FetchClient } from "@odata2ts/http-client-fetch";
import { isConcurrencyConflict, ODataConcurrencyError } from "@odata2ts/odata-service";
import { beforeEach, describe, expect, expectTypeOf, test } from "vitest";
import { LibraryService } from "../../src-generated/library/index.js";
import { expectODataError } from "../expectODataError.js";
import { BASE_URL, BOOK_DER_PROZESS, LIBRARY } from "../LibraryTestConstants.js";

/**
 * Optimistic concurrency against ASP.NET, which announces it **inline** on the `Copies` entity set and
 * names the property the token is computed from:
 *
 * ```xml
 * <Annotation Term="Org.OData.Core.V1.OptimisticConcurrency">
 *   <Collection><PropertyPath>Condition</PropertyPath></Collection>
 * </Annotation>
 * ```
 *
 * That is the half CAP does not show - it states the same term externally and with an empty collection.
 * Both are enough for a client, which never needs the property name; running the two suites side by side
 * is what proves that.
 */
describe("ASP.NET Library: optimistic concurrency", () => {
  const COPY = { MediumId: BOOK_DER_PROZESS, InventoryNumber: 1001 };

  beforeEach(async () => {
    // fills the ETag store, which every write below relies on
    const result = await LIBRARY.Copies(COPY).query().execute();
    expect(result.status).toBe(200);
  });

  test("a read hands the ETag over, and the following write carries it", async () => {
    const result = await LIBRARY.Copies(COPY).patch({ Condition: 7 }).execute();

    expect([200, 204]).toContain(result.status);
    expectTypeOf(result.data).toEqualTypeOf<undefined>();
  });

  test("the read really did state an ETag", async () => {
    const result = await LIBRARY.Copies(COPY).query().execute();

    const stated = result.headers["etag"] ?? (result.data as unknown as Record<string, string>)["@odata.etag"];
    expect(stated).toBeTruthy();
  });

  test("writing without ever reading is refused before a request is sent", async () => {
    const untouched = new LibraryService(new FetchClient(), BASE_URL);

    await expect(untouched.Copies(COPY).patch({ Condition: 7 }).execute()).rejects.toThrow(ODataConcurrencyError);
  });

  test("a stale ETag is refused by the server", async () => {
    const error = await expectODataError(LIBRARY.Copies(COPY).patch({ Condition: 8 }).withETag('W/"stale"').execute(), {
      status: 412,
      message: /.*/,
    });

    expect(isConcurrencyConflict(error)).toBe(true);
  });

  test("ignoreETag writes past whatever is current", async () => {
    const result = await LIBRARY.Copies(COPY).patch({ Condition: 6 }).ignoreETag().execute();

    expect([200, 204]).toContain(result.status);
  });

  test("a second write without re-reading is refused, since the first made the ETag stale", async () => {
    await LIBRARY.Copies(COPY).patch({ Condition: 5 }).execute();

    await expect(LIBRARY.Copies(COPY).patch({ Condition: 4 }).execute()).rejects.toThrow(ODataConcurrencyError);
  });

  test("reading the collection is enough to write to one of its rows", async () => {
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
});
