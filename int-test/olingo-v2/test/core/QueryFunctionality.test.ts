import { describe, expect, test } from "vitest";
import { BOOK_DER_PROZESS, LIBRARY } from "../LibraryTestConstants.js";

/**
 * The system query options V2 defines, against a server that implements them natively.
 *
 * Every one of these is graded `MAY` in [MS-ODATA] - there is no level at which `$filter` or `$top`
 * becomes mandatory for a V1-V3 service - so a client can assume nothing and this file is the proof for
 * this particular server. It supports all of them.
 */
describe("Olingo Library: query functionality", () => {
  test("$inlinecount instead of $count", async () => {
    const cmd = LIBRARY.Books().query((b) => b.count());
    expect(decodeURIComponent(cmd.getUrl())).toContain("$inlinecount=allpages");

    const result = await cmd.execute();

    expect(result.status).toBe(200);
    // a string, not a number - V2 serialises it as text
    expect(result.data.d.__count).toMatch(/^\d+$/);
    expect(Number(result.data.d.__count)).toBeGreaterThan(0);
  });

  test("$select", async () => {
    const result = await LIBRARY.Books(BOOK_DER_PROZESS)
      .query((b) => b.select("Title", "ISBN"))
      .execute();

    expect(result.status).toBe(200);
    expect(result.data.d.Title).toBe("Der Prozess");
    expect(result.data.d.ISBN).toBe("9783150094440");
    expect(result.data.d.PageCount).toBeUndefined();
  });

  test("$filter", async () => {
    const result = await LIBRARY.Books()
      .query((b, q) => b.filter(q.Language.eq("de")))
      .execute();

    expect(result.status).toBe(200);
    expect(result.data.d.results.length).toBeGreaterThan(0);
    expect(result.data.d.results.every((book) => book.Language === "de")).toBe(true);
  });

  test("$filter with in", async () => {
    const result = await LIBRARY.Books()
      .query((b, q) => b.filter(q.Language.in("de", "en")))
      .execute();

    expect(result.status).toBe(200);
    expect(result.data.d.results.every((book) => book.Language === "de" || book.Language === "en")).toBe(true);
  });

  test("a string filter function is spelled the V2 way", async () => {
    // V4's `contains(Title,'Prozess')` is `substringof('Prozess',Title)` in V2 - inverted arguments and
    // a different name. The q-object knows that, so the same call is valid in both versions.
    const cmd = LIBRARY.Books().query((b, q) => b.filter(q.Title.contains("Prozess")));
    expect(decodeURIComponent(cmd.getUrl())).toContain("$filter=substringof('Prozess',Title)");

    const result = await cmd.execute();
    expect(result.data.d.results.map((book) => book.Title)).toStrictEqual(["Der Prozess"]);
  });

  test("$top and $skip", async () => {
    const all = await LIBRARY.Books()
      .query((b, q) => b.orderBy(q.Title.asc()))
      .execute();
    expect(all.data.d.results.length).toBeGreaterThan(1);

    const skipped = await LIBRARY.Books()
      .query((b, q) => b.orderBy(q.Title.asc()).skip(1).top(1))
      .execute();

    expect(skipped.data.d.results.length).toBe(1);
    expect(skipped.data.d.results[0].Title).toBe(all.data.d.results[1].Title);
  });

  test("$orderby", async () => {
    const ascending = await LIBRARY.Books()
      .query((b, q) => b.orderBy(q.Title.asc()))
      .execute();
    const descending = await LIBRARY.Books()
      .query((b, q) => b.orderBy(q.Title.desc()))
      .execute();

    const ascendingTitles = ascending.data.d.results.map((book) => book.Title);
    expect(descending.data.d.results.map((book) => book.Title)).toStrictEqual([...ascendingTitles].reverse());
  });

  test("$expand", async () => {
    const result = await LIBRARY.Books(BOOK_DER_PROZESS)
      .query((b) => b.expand("Copies"))
      .execute();

    expect(result.status).toBe(200);
    // an expanded navigation property is the data itself, where an unexpanded one is a `__deferred` link.
    // V2 states a collection valued one as `{results: [...]}` - see feature/ResultsWrapping.test.ts
    const copies = result.data.d.Copies as { results: Array<{ MediumId: string }> };
    expect(copies.results.every((copy) => copy.MediumId === BOOK_DER_PROZESS)).toBe(true);
  });

  test("expanding() is a deep select, since $expand carries no options in V2", async () => {
    // V4 would render `$expand=Publisher($select=Name)`. V2 cannot nest anything inside `$expand`, so
    // the selection is lifted into the outer `$select` with a path.
    const cmd = LIBRARY.Books(BOOK_DER_PROZESS).query((b) => b.expanding("Publisher", (pb) => pb.select("Name")));

    const url = decodeURIComponent(cmd.getUrl());
    expect(url).toContain("$select=Publisher/Name");
    expect(url).toContain("$expand=Publisher");

    const result = await cmd.execute();
    expect(result.status).toBe(200);
    expect(result.data.d.Publisher).toMatchObject({ Name: "Reclam" });
  });

  test("the $count path segment", async () => {
    // Not reachable through the generated client - it is a resource path, not a query option - so this
    // is the one place a raw request says something the client cannot.
    const response = await fetch(`${LIBRARY.Books().getPath()}/$count`);

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/plain");
    expect(Number(await response.text())).toBeGreaterThan(0);
  });
});
