import { describe, expect, test } from "vitest";
import { expectODataError } from "../expectODataError.js";
import { BASE_URL, BOOK_DER_PROZESS, LIBRARY } from "../LibraryTestConstants.js";

describe("ASP.NET Library: query functionality", () => {
  test("$count", async () => {
    const result = await LIBRARY.Media()
      .query((builder) => {
        builder.count().top(0);
      })
      .execute();

    expect(result.status).toBe(200);
    expect(Number(result.data["@odata.count"])).toBeGreaterThan(0);
  });

  test("$select", async () => {
    const result = await LIBRARY.Media(BOOK_DER_PROZESS)
      .query((builder) => {
        builder.select("Title");
      })
      .execute();

    expect(result.data.Title).toBe("Der Prozess");
    expect(result.data.Language).toBeUndefined();
  });

  test("$filter", async () => {
    const result = await LIBRARY.Media()
      .query((builder, qMedium) => {
        builder.filter(qMedium.Language.eq("de"));
      })
      .execute();

    expect(result.data.value.length).toBeGreaterThan(0);
    expect(result.data.value.every((medium) => medium.Language === "de")).toBe(true);
  });

  test("$orderby with $top and $skip", async () => {
    const all = await LIBRARY.Media()
      .query((builder, qMedium) => {
        builder.orderBy(qMedium.Title.asc());
      })
      .execute();

    const skipped = await LIBRARY.Media()
      .query((builder, qMedium) => {
        builder.orderBy(qMedium.Title.asc()).top(2).skip(1);
      })
      .execute();

    expect(skipped.data.value.length).toBe(2);
    expect(skipped.data.value[0].Title).toBe(all.data.value[1].Title);
  });

  test("$expand", async () => {
    const result = await LIBRARY.Media(BOOK_DER_PROZESS)
      .query((builder) => {
        builder.select("Title").expand("Copies");
      })
      .execute();

    expect(result.data.Copies?.length).toBeGreaterThan(0);
  });

  test("$search actually filters", async () => {
    // The server only searches because a binder was written for it. Without one the option is accepted
    // and silently ignored, which is why this asserts a *smaller* result rather than just a 200.
    const all = await LIBRARY.Media()
      .query((builder) => {
        builder.count().top(0);
      })
      .execute();

    const found = await LIBRARY.Media()
      .query((builder) => {
        builder.search("Prozess");
      })
      .execute();

    expect(found.data.value.length).toBeGreaterThan(0);
    expect(found.data.value.length).toBeLessThan(Number(all.data["@odata.count"]));
    expect(found.data.value.every((medium) => medium.Title.includes("Prozess"))).toBe(true);
  });

  test("type-cast segment reaches the derived type", async () => {
    const response = await fetch(`${BASE_URL}/Media/Library.Catalog.Book`);

    expect(response.status).toBe(200);
  });
  test("$filter with in, rolled out as equals-expressions", async () => {
    // This client keeps the default, which emulates `in` - `int-test/cap` is generated with
    // `enableNativeInOperator` and covers the other state. Both spellings yield the same rows, so the URL
    // is the assertion which tells them apart at all.
    const request = LIBRARY.Media().query((builder, qMedium) => {
      builder.filter(qMedium.Language.in("de", "en"));
    });

    // decoded, since the query string travels percent-encoded
    expect(decodeURIComponent(request.getUrl())).toContain("$filter=(Language eq 'de' or Language eq 'en')");

    const result = await request.execute();

    expect(result.status).toBe(200);
    expect(result.data.value.length).toBeGreaterThan(0);
    expect(result.data.value.every((medium) => medium.Language === "de" || medium.Language === "en")).toBe(true);
  });

  test("$filter with any on a navigation collection", async () => {
    // A lambda operator renders as `Copies/any(a:a/Condition eq 1)`. Whether the server can evaluate that
    // over a navigation property is the question - a client cannot tell a wrong result from a right one
    // here, so this asserts against the same set fetched by expansion.
    const withLoanable = await LIBRARY.Media()
      .query((builder, qMedium) => {
        builder.select("Title").filter(qMedium.Copies.any((qCopy) => qCopy.IsLoanable.eq(true)));
      })
      .execute();

    expect(withLoanable.status).toBe(200);

    const expanded = await LIBRARY.Media()
      .query((builder) => builder.select("Title").expand("Copies"))
      .execute();
    const expectedTitles = expanded.data.value
      .filter((medium) => medium.Copies?.some((copy) => copy.IsLoanable))
      .map((medium) => medium.Title)
      .sort();

    expect(withLoanable.data.value.map((medium) => medium.Title).sort()).toStrictEqual(expectedTitles);
  });

  test("$filter with all on a primitive collection", async () => {
    const result = await LIBRARY.Media()
      .query((builder, qMedium) => {
        builder.select("Title").filter(qMedium.Keywords.all((keyword) => keyword.it.ne("Nonexistent")));
      })
      .execute();

    expect(result.status).toBe(200);
    // every medium qualifies, since no keyword has that value - the point is that the server evaluates it
    expect(result.data.value.length).toBeGreaterThan(0);
  });

  test("an invalid query option is refused with 400, and the message says why", async () => {
    // A negative $top is one of the few malformed queries the typed builder happily produces, so it is a
    // realistic way to reach the server's validation - and a caller needs the message to make sense of it.
    await expectODataError(
      LIBRARY.Media()
        .query((builder) => builder.top(-1))
        .execute(),
      { status: 400, message: /\$top query option requires a non-negative integer/ },
    );
  });
});
