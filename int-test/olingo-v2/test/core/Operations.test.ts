import { describe, expect, test } from "vitest";
import { expectODataError } from "../expectODataError.js";
import { BASE_URL, BOOK_DER_PROZESS, LIBRARY, LOAN_OPEN, UNKNOWN_ID } from "../LibraryTestConstants.js";

/**
 * Functions and actions over V2.
 *
 * V2 knows one kind of server-defined operation - the service operation, declared as a `FunctionImport`
 * and distinguished only by its HTTP method. There is no binding, so what the V4 model declares bound
 * appears here with the key of its receiver as an ordinary parameter, and there are no overloads and no
 * composability.
 *
 * All 26 work, covering every V2 return-type variant.
 */
describe("Olingo Library: operations", () => {
  test("an operation is an import on the container, with typed arguments", () => {
    expect(decodeURIComponent(LIBRARY.Search({ Term: "Prozess", MaxResults: 2 }).getUrl())).toBe(
      `${BASE_URL}/Search?Term='Prozess'&MaxResults=2`,
    );
    // what the V4 model binds to an entity keeps its receiver as a plain parameter
    expect(decodeURIComponent(LIBRARY.LoanMetrics({ MediumId: BOOK_DER_PROZESS }).getUrl())).toBe(
      `${BASE_URL}/LoanMetrics?MediumId=guid'${BOOK_DER_PROZESS}'`,
    );
  });

  test("primitive result, keyed by the operation name", async () => {
    const result = await LIBRARY.TotalMediaCount().execute();

    expect(result.status).toBe(200);
    /*
     * `ODataValueResponseV2<T>` says `d.<OperationName>` *is* the value, and here it is - an Edm.Int64
     * arrives as a plain string. The CAP V2 adapter wraps the same shape a second time, in
     * `{ value, __metadata }`; see int-test/cap/test/v2/core/Operations.test.ts. Olingo is the one that
     * matches what odata2ts types.
     */
    expect(result.data.d.TotalMediaCount).toMatch(/^\d+$/);
    expect(Number(result.data.d.TotalMediaCount)).toBeGreaterThan(0);
  });

  test("collection of primitives", async () => {
    const result = await LIBRARY.AllLanguages().execute();

    expect(result.status).toBe(200);
    expect(result.data.d.results).toContain("de");
  });

  test("complex result", async () => {
    const result = await LIBRARY.LoanMetrics({ MediumId: BOOK_DER_PROZESS }).execute();

    expect(result.status).toBe(200);
    // the operation-name wrapper is unwrapped by the generated response converter
    expect(result.data.d.TotalLoanCount).toMatch(/^\d+$/);
  });

  test("collection of complex results", async () => {
    const result = await LIBRARY.StatsPerBranch().execute();

    expect(result.status).toBe(200);
    expect(result.data.d.results.length).toBeGreaterThan(0);
    expect(result.data.d.results[0].BranchId).toBeDefined();
  });

  test("entity result", async () => {
    const result = await LIBRARY.MostReadMedium().execute();

    expect(result.status).toBe(200);
    expect(result.data.d.Title).toBeDefined();
    expect(result.data.d.__metadata.type).toBe("Library.Catalog.Book");
  });

  test("collection of entities, with parameters", async () => {
    const result = await LIBRARY.Search({ Term: "Prozess" }).execute();

    expect(result.status).toBe(200);
    expect(result.data.d.results.map((book) => book.Title)).toContain("Der Prozess");
  });

  test("an action returning nothing", async () => {
    // V2 allows an operation to return no value, and Olingo's own processor cannot serve one - the
    // server extends it for exactly this. From the client side it is simply a 204.
    const result = await LIBRARY.ClosureDay({ Day: "2026-12-24T00:00:00" }).execute();

    expect(result.status).toBe(204);
    expect(result.data).toBeUndefined();
  });

  test("a side-effecting operation answers 201, not 200", async () => {
    // Olingo answers every POST function import with 201 Created, even when it creates nothing. Pinned
    // because a client checking for 200 would treat a successful call as a failure.
    const result = await LIBRARY.NextInventoryNumber().execute();

    expect(result.status).toBe(201);
    expect(Number(result.data.d.NextInventoryNumber)).toBeGreaterThan(0);
  });

  test("an entity-returning action", async () => {
    const result = await LIBRARY.Renew({ LoanId: LOAN_OPEN }).execute();

    expect(result.status).toBe(201);
    expect(result.data.d.Id).toBe(LOAN_OPEN);
  });

  test("an operation that cannot find its receiver yields 404", async () => {
    await expectODataError(LIBRARY.OutstandingBalance({ MemberId: 9999 }).execute(), {
      status: 404,
      message: /could not be found/,
    });
    await expectODataError(LIBRARY.Renew({ LoanId: UNKNOWN_ID }).execute(), {
      status: 404,
      message: /could not be found/,
    });
  });

  test("a numeric parameter survives regardless of its magnitude", async () => {
    /*
     * Olingo types a function-import parameter from the literal it received rather than from the
     * declaration, so `MemberId=2` reaches the server's handler as a Byte and a larger value as an
     * Integer - the same operation, a different Java type per call. The server normalises; this asserts
     * that a client cannot tell, which is the part that matters here.
     */
    const small = await LIBRARY.OutstandingBalance({ MemberId: 2 }).execute();
    expect(small.status).toBe(200);
    expect(small.data.d.OutstandingBalance).toBe("4.50");

    await expectODataError(LIBRARY.OutstandingBalance({ MemberId: 70000 }).execute(), {
      status: 404,
      message: /could not be found/,
    });
  });
});
