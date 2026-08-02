import { describe, expect, test } from "vitest";
import { Library_Catalog_MediumStats } from "../../../src-generated/library-v2/LibraryV2Model.js";
import { expectODataError } from "../../expectODataError.js";
import { BASE_URL, BOOK_DER_PROZESS, LIBRARY_V2 } from "../LibraryV2TestConstants.js";

/**
 * Functions and actions over V2.
 *
 * V2 knows neither bound operations nor the `Namespace.Name(...)` call syntax: everything is a
 * `FunctionImport` on the entity container, addressed by name with its arguments as query parameters, and
 * `GET` vs. `POST` is the only distinction left between a function and an action. The adapter therefore
 * flattens every bound operation into an import named `<EntitySet>_<Operation>` whose first parameter is
 * the key of the entity it was bound to - `Books_LoanMetrics?Id=guid'...'`.
 *
 * odata2ts follows the metadata, so all 29 operations end up as methods on the *service* object rather than
 * on an entity service. Reaching an operation therefore means naming its entity twice: once in the method
 * and once in the key parameter.
 *
 * These require the server's custom handlers, which only load when the server is started through the full
 * `cds` tooling (as the published Docker image does).
 */
describe("CAP Library V2: operations", () => {
  test("an operation is an import on the container, with typed arguments", () => {
    expect(decodeURIComponent(LIBRARY_V2.Search({ Term: "Prozess", MaxResults: 1 }).getUrl())).toBe(
      `${BASE_URL}/Search?Term='Prozess'&MaxResults=1`,
    );

    // what was bound to an entity in V4 keeps its receiver as an ordinary parameter
    expect(decodeURIComponent(LIBRARY_V2.Books_LoanMetrics({ Id: BOOK_DER_PROZESS }).getUrl())).toBe(
      `${BASE_URL}/Books_LoanMetrics?Id=guid'${BOOK_DER_PROZESS}'`,
    );
  });

  test("unbound function with params", async () => {
    const result = await LIBRARY_V2.Search({ Term: "Prozess" }).execute();

    expect(result.status).toBe(200);
    expect(result.data.d.results.map((book) => book.Title)).toContain("Der Prozess");
  });

  test("unbound function returning a collection", async () => {
    const result = await LIBRARY_V2.AllLanguages().execute();

    expect(result.status).toBe(200);
    expect(result.data.d.results.length).toBeGreaterThan(0);
    expect(result.data.d.results).toContain("de");
  });

  test("unbound function returning an entity", async () => {
    const result = await LIBRARY_V2.MostReadMedium().execute();

    expect(result.status).toBe(200);
    expect(result.data.d.Title).toBeDefined();
    expect(result.data.d.__metadata.type).toBe("Library.Service.Books");
  });

  test("unbound action", async () => {
    const result = await LIBRARY_V2.NextInventoryNumber().execute();

    expect(result.status).toBe(200);
    // a primitive result is keyed by the operation name - which is exactly what ODataValueResponseV2 says
    expect(Number(result.data.d.NextInventoryNumber)).toBeGreaterThan(0);
  });

  test("void action", async () => {
    const result = await LIBRARY_V2.ClosureDay({ Day: "2026-12-24" }).execute();

    expect(result.status).toBe(204);
    expect(result.data).toBeUndefined();
  });

  test("bound function, reached through its flattened import", async () => {
    const result = await LIBRARY_V2.Books_LoanMetrics({ Id: BOOK_DER_PROZESS }).execute();

    expect(result.status).toBe(200);
    // the operation name wrapping a complex result is unwrapped by the generated response converter, so
    // `d` carries the complex type's properties directly
    const stats = result.data.d as unknown as Library_Catalog_MediumStats;
    expect(stats.TotalLoanCount).toBeDefined();
  });

  test("bound function returning a collection", async () => {
    const result = await LIBRARY_V2.Books_AvailableCopies({ Id: BOOK_DER_PROZESS }).execute();

    expect(result.status).toBe(200);
    expect(Array.isArray(result.data.d.results)).toBe(true);
    expect(result.data.d.results.every((copy) => copy.MediumId === BOOK_DER_PROZESS)).toBe(true);
  });

  test("bound action", async () => {
    const result = await LIBRARY_V2.Books_Reserve({ Id: BOOK_DER_PROZESS, MemberId: 1 }).execute();

    expect(result.status).toBe(200);
    expect(Number(result.data.d.Books_Reserve)).toBeGreaterThan(0);
  });

  test("an Edm.Int64 result arrives wrapped in an object the typing does not expect", async () => {
    /*
     * `ODataValueResponseV2<T>` says `d.<OperationName>` *is* the value, and that holds for the Int32 and
     * the Decimal returning operations above. Not for this one: the adapter hands the V4 payload
     * (`{"@odata.context": ..., "value": 19}`) through as a nested object instead of lifting the value out,
     * so a caller reading `d.TotalMediaCount` gets `{ value, __metadata }` where the compiler promises a
     * string. Pinned because nothing else makes this visible - the request itself succeeds.
     */
    const result = await LIBRARY_V2.TotalMediaCount().execute();

    expect(result.status).toBe(200);
    expect(result.data.d.TotalMediaCount as unknown).toStrictEqual({
      value: expect.stringMatching(/^\d+$/),
      __metadata: {},
    });
  });

  test("a complex operation result carries a type name the metadata does not contain", async () => {
    // `Library_Circulation_AnnualReport` in `$metadata`, `Library.Service.ion_AnnualReport` in the payload:
    // the adapter mangles the flattened namespace when it builds `__metadata.type`. Harmless for odata2ts,
    // which never reads that field, but it makes the payload unusable for anything that dispatches on the
    // declared type.
    const result = await LIBRARY_V2.YearEndClosing({ Year: 2024 }).execute();

    expect(result.status).toBe(200);
    expect((result.data.d as unknown as { __metadata: { type: string } }).__metadata.type).toBe(
      "Library.Service.ion_AnnualReport",
    );
  });

  test("an operation bound to a collection cannot be reached at all", async () => {
    // `AvailableLanguages` is bound to `many $self` in CDS, i.e. to the *set* of books. The adapter still
    // flattens it into a single-key import, so the only call the metadata allows is the one the V4 service
    // underneath then refuses. There is no way to spell the intended call in V2.
    await expectODataError(LIBRARY_V2.Books_AvailableLanguages({ Id: BOOK_DER_PROZESS }).execute(), {
      status: 400,
      message: /must be called on a collection of Library\.Service\.Books/,
    });
  });

  test("an operation on an ETag-carrying entity demands a precondition odata2ts cannot send", async () => {
    // `Copy.Condition` carries `@odata.etag`, so every write against a copy - this action included - needs
    // `If-Match`. odata2ts sends none, in either version, so the operation stays unreachable over V4 as
    // well. See core/CrudOperations.test.ts for what V2 does differently: it declares the token in the
    // metadata, where V4 leaves the annotation empty.
    await expectODataError(
      LIBRARY_V2.Copies_CheckOut({ MediumId: BOOK_DER_PROZESS, InventoryNumber: 1001, MemberId: 1 }).execute(),
      { status: 428, message: /Precondition Required/ },
    );
  });

  test("a complex operation parameter has no V2 notation", async () => {
    // V2 function imports take primitive parameters only. The reference model has one operation with a
    // structured parameter, and odata2ts renders it as best it can - which the server cannot read back.
    await expectODataError(LIBRARY_V2.LoanStatistics({ Period: { From: "2024-01-01", To: "2024-12-31" } }).execute(), {
      status: 400,
      message: /Invalid value: Period/,
    });
  });
});
