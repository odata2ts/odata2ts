import { describe, expect, test } from "vitest";
import { BOOK_DER_PROZESS, LIBRARY } from "../LibraryTestConstants";

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
});
