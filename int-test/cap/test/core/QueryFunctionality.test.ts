import { describe, expect, test } from "vitest";
import { BOOK_DER_PROZESS, LIBRARY } from "../LibraryTestConstants.js";

/**
 * The system query options on read requests. Their use on write requests (create / add / update /
 * patch) is covered by feature/CrudQuery.test.ts.
 */
describe("CAP Library: query functionality", () => {
  test("$count", async () => {
    const result = await LIBRARY.Books()
      .query((b) => b.count())
      .execute();

    expect(result.status).toBe(200);
    expect(result.data["@odata.count"]).toBeGreaterThan(0);
    expect(result.data.value.length).toBeGreaterThan(0);
  });

  test("$select", async () => {
    const result = await LIBRARY.Books(BOOK_DER_PROZESS)
      .query((b) => b.select("Title", "Language"))
      .execute();

    expect(result.status).toBe(200);
    expect(result.data.Title).toBe("Der Prozess");
    expect(result.data.Language).toBe("de");
    // not selected => not delivered
    expect(result.data.ISBN).toBeUndefined();
  });

  test("$filter", async () => {
    const result = await LIBRARY.Books()
      .query((b, q) => b.filter(q.Language.eq("de")))
      .execute();

    expect(result.status).toBe(200);
    expect(result.data.value.length).toBeGreaterThan(0);
    expect(result.data.value.every((book) => book.Language === "de")).toBe(true);
  });

  test("$top and $skip", async () => {
    const all = await LIBRARY.Books()
      .query((b, q) => b.orderBy(q.Title.asc()))
      .execute();
    expect(all.data.value.length).toBeGreaterThan(1);

    const skipped = await LIBRARY.Books()
      .query((b, q) => b.orderBy(q.Title.asc()).skip(1).top(1))
      .execute();

    expect(skipped.data.value.length).toBe(1);
    expect(skipped.data.value[0].Title).toBe(all.data.value[1].Title);
  });

  test("$orderby", async () => {
    const ascending = await LIBRARY.Books()
      .query((b, q) => b.orderBy(q.Title.asc()))
      .execute();
    const descending = await LIBRARY.Books()
      .query((b, q) => b.orderBy(q.Title.desc()))
      .execute();

    // compared against the server's own ascending result, so this makes no assumption
    // about how the server collates strings
    const ascendingTitles = ascending.data.value.map((book) => book.Title);
    const descendingTitles = descending.data.value.map((book) => book.Title);

    expect(descendingTitles.length).toBeGreaterThan(1);
    expect(descendingTitles).toStrictEqual([...ascendingTitles].reverse());
  });

  test("$expand", async () => {
    const result = await LIBRARY.Books(BOOK_DER_PROZESS)
      .query((b) => b.select("Title").expand("Publisher"))
      .execute();

    expect(result.status).toBe(200);
    expect(result.data.Publisher).toBeDefined();
    expect(result.data.Publisher?.Id).toBeDefined();
  });
  test("$filter with in", async () => {
    const result = await LIBRARY.Books()
      .query((builder, qBook) => {
        builder.filter(qBook.Language.in("de", "en"));
      })
      .execute();

    expect(result.status).toBe(200);
    expect(result.data.value.length).toBeGreaterThan(0);
    expect(result.data.value.every((book) => book.Language === "de" || book.Language === "en")).toBe(true);
  });

  test("$filter with any on a navigation collection", async () => {
    const result = await LIBRARY.Books()
      .query((builder, qBook) => {
        builder.select("Title").filter(qBook.Copies.any((qCopy) => qCopy.IsLoanable.eq(true)));
      })
      .execute();

    expect(result.status).toBe(200);

    const expanded = await LIBRARY.Books()
      .query((builder) => builder.select("Title").expand("Copies"))
      .execute();
    const expectedTitles = expanded.data.value
      .filter((book) => book.Copies?.some((copy) => copy.IsLoanable))
      .map((book) => book.Title)
      .sort();

    expect(result.data.value.map((book) => book.Title).sort()).toStrictEqual(expectedTitles);
  });

  /**
   * Skipped because it **takes the server down**, not because odata2ts gets it wrong: a lambda over a
   * *primitive* collection - `$filter=Keywords/all(a:a ne 'X')`, which is valid OData and exactly what the
   * query builder renders - makes `@sap/cds` 10.0.3 throw an uncaught TypeError in its OData parser
   * (`libx/odata/parse/afterburner.js`, `_validateXpr`: "Cannot read properties of undefined (reading
   * 'id')") and the process exits. All test files share one server, so running it would fail everything
   * after it. Works on ASP.NET, see the same test there.
   */
  test.skip("$filter with all on a primitive collection", async () => {
    const result = await LIBRARY.Books()
      .query((builder, qBook) => {
        builder.select("Title").filter(qBook.Keywords.all((keyword) => keyword.it.ne("Nonexistent")));
      })
      .execute();

    expect(result.status).toBe(200);
  });

  test("an invalid query option is silently ignored here", async () => {
    // A negative $top is refused with 400 by ASP.NET; CAP accepts the request and answers with the
    // unrestricted set. Asserted because the difference matters to a client: there is no error to react
    // to, and a caller who trusts $top would page wrongly without noticing.
    const result = await LIBRARY.Books()
      .query((builder) => builder.top(-1))
      .execute();

    expect(result.status).toBe(200);
    expect(result.data.value.length).toBeGreaterThan(0);
  });
});
