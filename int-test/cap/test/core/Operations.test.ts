import { describe, expect, test } from "vitest";
import { BOOK_DER_PROZESS, LIBRARY } from "../LibraryTestConstants";

/**
 * Functions and actions - unbound (via the entity container) as well as bound to an entity.
 *
 * These require the server's custom handlers to be loaded, which only happens when the server is
 * started through the full `cds` tooling (as the published Docker image does). A server started via
 * the bare `cds-serve` binary answers 501 here, while the CRUD and query tests still pass.
 */
describe("CAP Library: operations", () => {
  test("unbound function without params", async () => {
    const result = await LIBRARY.TotalMediaCount().execute();

    expect(result.status).toBe(200);
    // Edm.Int64 is emitted as string when no converter is configured
    expect(String(result.data.value)).toMatch(/^\d+$/);
    expect(Number(result.data.value)).toBeGreaterThan(0);
  });

  test("unbound function with params", async () => {
    const result = await LIBRARY.Search({ Term: "Prozess" }).execute();

    expect(result.status).toBe(200);
    expect(result.data.value.map((book) => book.Title)).toContain("Der Prozess");
  });

  test("unbound function returning a collection", async () => {
    const result = await LIBRARY.AllLanguages().execute();

    expect(result.status).toBe(200);
    expect(result.data.value.length).toBeGreaterThan(0);
    expect(result.data.value).toContain("de");
  });

  test("unbound action", async () => {
    const result = await LIBRARY.NextInventoryNumber().execute();

    expect(result.status).toBe(200);
    expect(Number(result.data.value)).toBeGreaterThan(0);
  });

  test("bound function", async () => {
    const result = await LIBRARY.Books(BOOK_DER_PROZESS).LoanMetrics().execute();

    expect(result.status).toBe(200);
    expect(result.data).toBeDefined();
  });

  test("bound function returning a collection", async () => {
    const result = await LIBRARY.Books(BOOK_DER_PROZESS).AvailableCopies().execute();

    expect(result.status).toBe(200);
    expect(Array.isArray(result.data.value)).toBe(true);
  });

  test("bound action", async () => {
    const result = await LIBRARY.Books(BOOK_DER_PROZESS).Reserve({ MemberId: 1 }).execute();

    expect(result.status).toBe(200);
    expect(result.data).toBeDefined();
  });
});
