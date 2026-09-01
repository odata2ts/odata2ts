import { FetchClient } from "@odata2ts/http-client-fetch";
import { isConcurrencyConflict, isConcurrencyRequired, ODataConcurrencyError } from "@odata2ts/odata-service";
import { afterAll, beforeAll, beforeEach, describe, expect, test } from "vitest";
import { LibraryService } from "../../src-generated/library/index.js";
import { AvailabilityStatus } from "../../src-generated/library/library-catalog/index.js";
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
 *
 * The copy is created here rather than taken from the seed, so that repeatedly rewriting its concurrency
 * token cannot disturb another suite.
 */
describe("ASP.NET Library: optimistic concurrency", () => {
  const INVENTORY_NUMBER = 7301;
  const COPY = { MediumId: BOOK_DER_PROZESS, InventoryNumber: INVENTORY_NUMBER };

  beforeAll(async () => {
    const created = await LIBRARY.Copies()
      .create({
        MediumId: BOOK_DER_PROZESS,
        InventoryNumber: INVENTORY_NUMBER,
        IsLoanable: true,
        Condition: 1,
        WeightKg: 0.3,
        Status: AvailabilityStatus.Available,
      })
      .execute();
    expect(created.status).toBe(201);
  });

  afterAll(async () => {
    await LIBRARY.Copies(COPY).delete().ignoreETag().execute();
  });

  beforeEach(async () => {
    // fills the ETag store, which every write below relies on
    const result = await LIBRARY.Copies(COPY).query().execute();
    expect(result.status).toBe(200);
  });

  test("a read hands the ETag over, and the following write carries it", async () => {
    const result = await LIBRARY.Copies(COPY).patch({ Condition: 7 }).execute();

    expect([200, 204]).toContain(result.status);
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
    // the 412 carries no error payload here, so there is no message to pin - unlike the status, which
    // is what the client turns into a concurrency conflict
    const error = await expectODataError(LIBRARY.Copies(COPY).patch({ Condition: 8 }).withETag('W/"stale"').execute(), {
      status: 412,
      message: /.*/,
    });

    expect(isConcurrencyConflict(error)).toBe(true);
    expect(isConcurrencyRequired(error)).toBe(false);
  });

  test("ignoreETag writes past whatever is current", async () => {
    const result = await LIBRARY.Copies(COPY).patch({ Condition: 6 }).ignoreETag().execute();

    expect([200, 204]).toContain(result.status);
  });

  test("a collection read states no per-row ETag here, so it fills nothing", async () => {
    /*
     * The counterpart of the CAP test of the same shape, and the reason both are worth having: ASP.NET
     * states an ETag on a single entity but not on the rows of a collection, so "read the list, then
     * patch one row" cannot work against it. Nothing in the specification requires those per-row ETags -
     * §11.4.1.1 demands one on a GET *to the resource* - so this is a legitimate difference rather than a
     * defect, and the client degrades to demanding a read of the entity itself.
     */
    const fresh = new LibraryService(new FetchClient(), BASE_URL);
    const list = await fresh
      .Copies()
      .query((b, q) => b.filter(q.InventoryNumber.eq(INVENTORY_NUMBER)))
      .execute();
    expect(list.data.value.length).toBe(1);

    await expect(fresh.Copies(COPY).patch({ Condition: 3 }).execute()).rejects.toThrow(ODataConcurrencyError);
  });

  test("blindConcurrencyWrites writes without any read at all", async () => {
    const blind = new LibraryService(new FetchClient(undefined, { blindConcurrencyWrites: true }), BASE_URL);

    const result = await blind.Copies(COPY).patch({ Condition: 2 }).execute();

    expect([200, 204]).toContain(result.status);
  });

  test("AssessCondition, an action bound to the entity, carries the ETag the preceding read filled in", async () => {
    // this call succeeds whether or not the client sends `If-Match`: ASP.NET's action controllers, unlike
    // its PATCH/DELETE pipeline, never check the header (IMPLEMENTATION.md, "What the database gained"),
    // so what actually proves the fix on this server is the client-side test below, which never reaches
    // the network in the first place
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
