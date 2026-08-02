import { HttpResponseModel } from "@odata2ts/http-client-api";
import { ODataValueResponseV4 } from "@odata2ts/odata-core";
import { describe, expect, expectTypeOf, test } from "vitest";
import { expectODataError } from "../expectODataError.js";
import { BASE_URL, BOOK_DER_PROZESS, LIBRARY } from "../LibraryTestConstants.js";

/**
 * Services for individual properties - the `enablePrimitivePropertyServices` feature, switched on in this
 * package's `odata2ts.config.ts` so that it meets a real server at all.
 *
 * odata2ts builds the URLs the spec prescribes, and they are asserted here. **This server serves none of
 * them**: an individual property is not addressable, on any entity, in any of the three forms. That is a
 * gap of the server, not of the client, and it is asserted rather than dropped - CAP serves all of it,
 * see the same file in `int-test/cap` for the behaviour a working implementation shows.
 */
describe("ASP.NET Library: property services", () => {
  const book = () => LIBRARY.Media(BOOK_DER_PROZESS);

  test("a primitive property is addressed by appending its name", () => {
    expect(book().Title().getPath()).toBe(`${BASE_URL}/Media(${BOOK_DER_PROZESS})/Title`);

    // the method, not a call: `expectTypeOf` evaluates its argument
    expectTypeOf(book().Title().getValue().execute).returns.resolves.toEqualTypeOf<
      HttpResponseModel<ODataValueResponseV4<string> | undefined>
    >();
  });

  test("reading an individual property is not served", async () => {
    await expectODataError(book().Title().getValue().execute(), { status: 404, message: /No error message/ });
  });

  test("writing an individual property is not served", async () => {
    await expectODataError(book().Title().updateValue("Der Prozess").execute(), {
      status: 404,
      message: /No error message/,
    });
  });

  test("a collection-valued property is not served either", async () => {
    const keywords = book().Keywords();

    expect(keywords.getPath()).toBe(`${BASE_URL}/Media(${BOOK_DER_PROZESS})/Keywords`);
    await expectODataError(keywords.query().execute(), { status: 404, message: /No error message/ });
  });

  test("the values are of course reachable through the entity", async () => {
    // The point of the four assertions above is *not* that the data is unreachable - `$select` gets it.
    // What is missing is the individual resource, which is what a property service addresses.
    const result = await book()
      .query((builder) => builder.select("Title", "Keywords"))
      .execute();

    expect(result.data.Title).toBe("Der Prozess");
    expect(result.data.Keywords?.length).toBeGreaterThan(0);
  });
});
