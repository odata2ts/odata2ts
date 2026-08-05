import { describe, expect, test } from "vitest";
import { BOOK_DER_PROZESS, LIBRARY_V2 } from "../LibraryV2TestConstants.js";

/**
 * The system query options V2 knows, on read requests.
 *
 * The query builder is version-aware, so most of this reads like the V4 file - the differences are in what
 * the builder is allowed to render and in what comes back:
 *
 * - counting is `$inlinecount=allpages` and the count arrives as a **string** in `d.__count`
 * - `$expand` carries no nested options, so `expanding()` is a deep *select* and nothing more
 * - `$search`, `$apply`/`groupBy` and the `$count` path segment do not exist in V2 and the builder does
 *   not offer them
 *
 * What the builder does still offer, although V2 has no such thing, are the lambda operators - see the
 * last two tests.
 */
describe("CAP Library V2: query functionality", () => {
  test("$inlinecount instead of $count", async () => {
    const cmd = LIBRARY_V2.Books().query((b) => b.count());
    expect(decodeURIComponent(cmd.getUrl())).toContain("$inlinecount=allpages");

    const result = await cmd.execute();

    expect(result.status).toBe(200);
    // a string, not a number - V2 serialises it as text and odata2ts hands it over unchanged
    expect(result.data.d.__count).toMatch(/^\d+$/);
    expect(Number(result.data.d.__count)).toBeGreaterThan(0);
    expect(result.data.d.results.length).toBeGreaterThan(0);
  });

  test("$select", async () => {
    const result = await LIBRARY_V2.Books(BOOK_DER_PROZESS)
      .query((b) => b.select("Title", "Language"))
      .execute();

    expect(result.status).toBe(200);
    expect(result.data.d.Title).toBe("Der Prozess");
    expect(result.data.d.Language).toBe("de");
    expect(result.data.d.ISBN).toBeUndefined();
  });

  test("$filter", async () => {
    const result = await LIBRARY_V2.Books()
      .query((b, q) => b.filter(q.Language.eq("de")))
      .execute();

    expect(result.status).toBe(200);
    expect(result.data.d.results.length).toBeGreaterThan(0);
    expect(result.data.d.results.every((book) => book.Language === "de")).toBe(true);
  });

  test("$filter with in", async () => {
    const result = await LIBRARY_V2.Books()
      .query((b, q) => b.filter(q.Language.in("de", "en")))
      .execute();

    expect(result.status).toBe(200);
    expect(result.data.d.results.length).toBeGreaterThan(0);
    expect(result.data.d.results.every((book) => book.Language === "de" || book.Language === "en")).toBe(true);
  });

  test("a string filter function is spelled the V2 way", async () => {
    // V4's `contains(Title,'Prozess')` is `substringof('Prozess',Title)` in V2 - inverted arguments and a
    // different name. The q-object knows that, so the same `contains()` call yields valid OData in both
    // versions; nothing about it is visible to the caller.
    const cmd = LIBRARY_V2.Books().query((b, q) => b.filter(q.Title.contains("Prozess")));
    expect(decodeURIComponent(cmd.getUrl())).toContain("$filter=substringof('Prozess',Title)");

    const result = await cmd.execute();
    expect(result.status).toBe(200);
    expect(result.data.d.results.map((book) => book.Title)).toStrictEqual(["Der Prozess"]);
  });

  test("$top and $skip", async () => {
    const all = await LIBRARY_V2.Books()
      .query((b, q) => b.orderBy(q.Title.asc()))
      .execute();
    expect(all.data.d.results.length).toBeGreaterThan(1);

    const skipped = await LIBRARY_V2.Books()
      .query((b, q) => b.orderBy(q.Title.asc()).skip(1).top(1))
      .execute();

    expect(skipped.data.d.results.length).toBe(1);
    expect(skipped.data.d.results[0].Title).toBe(all.data.d.results[1].Title);
  });

  test("$orderby", async () => {
    const ascending = await LIBRARY_V2.Books()
      .query((b, q) => b.orderBy(q.Title.asc()))
      .execute();
    const descending = await LIBRARY_V2.Books()
      .query((b, q) => b.orderBy(q.Title.desc()))
      .execute();

    const ascendingTitles = ascending.data.d.results.map((book) => book.Title);
    const descendingTitles = descending.data.d.results.map((book) => book.Title);

    expect(descendingTitles.length).toBeGreaterThan(1);
    expect(descendingTitles).toStrictEqual([...ascendingTitles].reverse());
  });

  test("$expand", async () => {
    const result = await LIBRARY_V2.Books(BOOK_DER_PROZESS)
      .query((b) => b.select("Title").expand("Publisher"))
      .execute();

    expect(result.status).toBe(200);
    // an expanded navigation property is the entity itself, where an unexpanded one is a `__deferred` link
    expect(result.data.d.Publisher).toMatchObject({ Name: "Reclam" });
  });

  test("expanding() is a deep select, since $expand carries no options in V2", async () => {
    // V4 would render `$expand=Publisher($select=Name)`. V2 cannot nest anything inside `$expand`, so the
    // selection is lifted into the outer `$select` with a path - which is why `ExpandingQueryBuilderV2`
    // offers `select` and nothing else.
    const cmd = LIBRARY_V2.Books(BOOK_DER_PROZESS).query((b) => b.expanding("Publisher", (pb) => pb.select("Name")));

    const url = decodeURIComponent(cmd.getUrl());
    expect(url).toContain("$select=Publisher/Name");
    expect(url).toContain("$expand=Publisher");

    const result = await cmd.execute();
    expect(result.status).toBe(200);
    expect(result.data.d.Publisher).toMatchObject({ Name: "Reclam" });
    // narrowed as asked: the publisher's other properties did not come along
    expect((result.data.d.Publisher as unknown as Record<string, unknown>).Country).toBeUndefined();
  });

  test("a lambda over a navigation collection is rendered - and this server evaluates it", async () => {
    /*
     * `any()` is not part of OData V2, but the q-objects offer it in both versions, so the builder happily
     * renders `Copies/any(a:a/IsLoanable eq true)` into a V2 URL. A strict V2 server would refuse that.
     *
     * This one does not: the adapter hands `$filter` through to the V4 endpoint unchanged, which parses it
     * fine. So the request works *because* there is a V4 service underneath - not because it is valid V2.
     * Asserted with the actual result, since a wrong filter that is silently ignored also answers 200.
     */
    const result = await LIBRARY_V2.Books()
      .query((b, q) => b.select("Title").filter(q.Copies.any((copy) => copy.IsLoanable.eq(true))))
      .execute();

    expect(result.status).toBe(200);

    const expanded = await LIBRARY_V2.Books()
      .query((b) => b.select("Title").expand("Copies"))
      .execute();
    const expectedTitles = expanded.data.d.results
      .filter((book) =>
        (book.Copies as { results: Array<{ IsLoanable: boolean }> }).results.some((copy) => copy.IsLoanable),
      )
      .map((book) => book.Title)
      .sort();

    expect(expectedTitles.length).toBeGreaterThan(0);
    expect(result.data.d.results.map((book) => book.Title).sort()).toStrictEqual(expectedTitles);
  });

  /**
   * Skipped for the same reason as its V4 twin: it **takes the server down**. `$filter=Keywords/all(a:a ne
   * 'X')` reaches the V4 endpoint through the adapter, where `@sap/cds` 10.0.3 throws an uncaught TypeError
   * in its OData parser and the process exits - so running it would fail every test after it, in both
   * folders, since all files share one server.
   *
   * Kept here to record that the adapter changes nothing about it: the crash is CAP's, and V2 is merely
   * another way to reach it.
   */
  test.skip("$filter with all on a primitive collection", async () => {
    const result = await LIBRARY_V2.Books()
      .query((b, q) => b.select("Title").filter(q.Keywords.all((keyword) => keyword.it.ne("Nonexistent"))))
      .execute();

    expect(result.status).toBe(200);
  });

  test("an invalid query option is silently ignored here too", async () => {
    const result = await LIBRARY_V2.Books()
      .query((b) => b.top(-1))
      .execute();

    expect(result.status).toBe(200);
    expect(result.data.d.results.length).toBeGreaterThan(0);
  });
});
