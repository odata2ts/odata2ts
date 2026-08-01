import { describe, expect, test } from "vitest";
import { BOOK_DER_PROZESS, LIBRARY } from "../LibraryTestConstants.js";

describe("ASP.NET Library: functions and actions", () => {
  test("unbound function without params", async () => {
    const result = await LIBRARY.TotalMediaCount().execute();

    expect(result.status).toBe(200);
    expect(Number(result.data.value)).toBeGreaterThan(0);
  });

  test("unbound function returning a collection", async () => {
    const result = await LIBRARY.AllLanguages().execute();

    expect(result.data.value).toContain("de");
  });

  test("unbound function with params", async () => {
    const result = await LIBRARY.Search({ Term: "Prozess" }).execute();

    expect(result.data.value.length).toBe(1);
    expect(result.data.value[0].Title).toBe("Der Prozess");
  });

  test("overload of the same function, differing in parameter count", async () => {
    // Both overloads survive into the metadata; this proves the second one is callable and honours its
    // extra parameter.
    const unlimited = await LIBRARY.Search({ Term: "e" }).execute();
    const limited = await LIBRARY.Search({ Term: "e", MaxResults: 2 }).execute();

    expect(unlimited.data.value.length).toBeGreaterThan(2);
    expect(limited.data.value.length).toBe(2);
  });

  test("unbound function returning an entity", async () => {
    const result = await LIBRARY.MostReadMedium().execute();

    expect(result.status).toBe(200);
    expect(result.data.Title).toBeDefined();
  });

  test("unbound action", async () => {
    const result = await LIBRARY.NextInventoryNumber().execute();

    expect(result.status).toBe(200);
    expect(Number(result.data.value)).toBeGreaterThan(0);
  });

  test("unbound action with a collection parameter", async () => {
    const result = await LIBRARY.CleanUpKeywords({ Obsolete: ["Fragment"] }).execute();

    expect(result.data.value).not.toContain("Fragment");
  });

  test("bound function on a single entity", async () => {
    const result = await LIBRARY.Members(1).OutstandingBalance().execute();

    expect(result.status).toBe(200);
    expect(Number(result.data.value)).toBeGreaterThanOrEqual(0);
  });

  test("bound function on a collection", async () => {
    const result = await LIBRARY.Media().AvailableLanguages().execute();

    expect(result.data.value).toContain("de");
  });

  test("bound function returning a complex type", async () => {
    const result = await LIBRARY.Media(BOOK_DER_PROZESS).LoanMetrics().execute();

    expect(result.status).toBe(200);
    expect(result.data).toHaveProperty("TotalLoanCount");
  });

  test("bound action", async () => {
    const result = await LIBRARY.Media(BOOK_DER_PROZESS).Reserve({ MemberId: 1 }).execute();

    expect(result.status).toBe(200);
    expect(Number(result.data.value)).toBeGreaterThan(0);
  });
});
