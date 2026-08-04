import { HttpResponseModel } from "@odata2ts/http-client-api";
import { ODataCollectionResponseV4 } from "@odata2ts/odata-core";
import { describe, expect, expectTypeOf, test } from "vitest";
import { Medium } from "../../src-generated/library/library-catalog/index.js";
import { expectODataError } from "../expectODataError.js";
import { BASE_URL, LIBRARY } from "../LibraryTestConstants.js";

/**
 * Composable functions - `IsComposable="true"` - whose result can be addressed further: query options on
 * top of it, a navigation property behind it, even another operation.
 *
 * Only this server has them: CAP emits no composable function at all. The generated client answers with a
 * `ComposableUrlRequestCmd`, whose `compose()` hands out the service of the returned type, so everything
 * that service can do applies to the function result.
 */
describe("ASP.NET Library: composable functions", () => {
  test("called plainly, it behaves like any function", async () => {
    const request = LIBRARY.NewReleases();

    expect(request.getUrl()).toBe(`${BASE_URL}/NewReleases()`);

    const result = await request.execute();

    expect(result.status).toBe(200);
    expect(result.data.value.length).toBeGreaterThan(0);
    expectTypeOf(result).toEqualTypeOf<HttpResponseModel<ODataCollectionResponseV4<Medium>>>();
  });

  test("query options apply to the function result", async () => {
    const base = LIBRARY.NewReleases();
    const request = base
      .compose()
      .query((builder, qMedium) => builder.select("Title").filter(qMedium.Language.eq("de")));

    expect(request.getUrl()).toBe(
      `${BASE_URL}/NewReleases()?%24select=Title&%24filter=${encodeURIComponent("Language eq 'de'")}`,
    );

    const result = await request.execute();

    expect(result.status).toBe(200);
    expect(result.data.value.length).toBeGreaterThan(0);
    expect(result.data.value.every((medium) => medium.Title !== undefined)).toBe(true);
    // narrowed by $select, so anything else is absent
    expect(result.data.value.every((medium) => medium.Id === undefined)).toBe(true);
  });

  test("counting the function result", async () => {
    const result = await LIBRARY.NewReleases()
      .compose()
      .query((builder) => builder.count().top(0))
      .execute();

    expect(result.status).toBe(200);
    expect(Number(result.data["@odata.count"])).toBeGreaterThan(0);
  });

  test("an operation behind the function result is addressed correctly, but not routed", async () => {
    // `compose()` hands out the collection service of the returned type, so everything that service
    // offers applies - including an operation bound to `Collection(Medium)`. odata2ts builds that URL,
    // and the server does not route it: composition works for query options but not for a bound
    // operation behind the function. Asserted so the boundary is documented rather than assumed.
    const request = LIBRARY.NewReleases().compose().AvailableCopies();

    expect(request.getUrl()).toBe(`${BASE_URL}/NewReleases()/Library.Circulation.AvailableCopies()`);

    await expectODataError(request.execute(), { status: 404, message: /No error message/ });
  });

  test("a non-composable function cannot be composed at all - the typing says so", () => {
    // `MostReadMedium` has no IsComposable, so the generator hands out a plain request command without
    // `compose()`. That is the better place for this to fail than a 400 from the server, and pinning it
    // keeps the distinction from disappearing in a refactoring.
    expectTypeOf(LIBRARY.MostReadMedium()).not.toHaveProperty("compose");
    expectTypeOf(LIBRARY.NewReleases()).toHaveProperty("compose");
  });
});
