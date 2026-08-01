import { describe, expect, test } from "vitest";
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
});
