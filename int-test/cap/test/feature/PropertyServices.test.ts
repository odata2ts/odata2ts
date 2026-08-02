import { HttpResponseModel } from "@odata2ts/http-client-api";
import { ODataCollectionResponseV4, ODataValueResponseV4 } from "@odata2ts/odata-core";
import { StringCollection } from "@odata2ts/odata-query-objects";
import { afterAll, beforeAll, describe, expect, expectTypeOf, test } from "vitest";
import { expectODataError } from "../expectODataError.js";
import { BASE_URL, BOOK_DER_PROZESS, LIBRARY } from "../LibraryTestConstants.js";

/**
 * Services for individual properties - the `enablePrimitivePropertyServices` feature, which is switched
 * on in this package's `odata2ts.config.ts` precisely so that it meets a real server here.
 *
 * OData addresses a single property by appending its name to the entity URL, and the generated client
 * offers a service per property for it: `getValue` / `updateValue` / `deleteValue` for a primitive one,
 * a full collection service for a collection-valued one.
 *
 * CAP serves all of this. ASP.NET Core serves none of it (404 for every individual property), which is
 * asserted in the sibling package rather than left untested.
 */
describe("CAP Library: property services", () => {
  const book = () => LIBRARY.Books(BOOK_DER_PROZESS);

  // the seed data is the contract other files assert against, so anything written here is put back
  afterAll(async () => {
    await book().Language().updateValue("de").execute();
    await book().Keywords().update(["Roman", "Klassiker", "Fragment"]).execute();
  });

  describe("primitive property", () => {
    test("the property name is appended to the entity URL", () => {
      expect(book().Title().getPath()).toBe(`${BASE_URL}/Books(${BOOK_DER_PROZESS})/Title`);
    });

    test("read a single value", async () => {
      const result = await book().Title().getValue().execute();

      expect(result.status).toBe(200);
      expect(result.data?.value).toBe("Der Prozess");

      // a value response wraps the raw value in `value` - not the model, not a collection
      expectTypeOf(result).toEqualTypeOf<HttpResponseModel<ODataValueResponseV4<string> | undefined>>();
    });

    test("update a single value", async () => {
      const updated = await book().Language().updateValue("en").execute();

      // CAP answers a property update with 200 and the new value
      expect(updated.status).toBe(200);
      expect((await book().Language().getValue().execute()).data?.value).toBe("en");
      // ... and the entity as a whole sees it too
      expect((await book().query().execute()).data.Language).toBe("en");
    });

    test("delete a nullable value", async () => {
      const deleted = await book().Language().deleteValue().execute();
      expect(deleted.status).toBe(204);
      expectTypeOf(deleted).toEqualTypeOf<HttpResponseModel<undefined>>();

      // reading a null value answers 204, so there is no `value` wrapper to unpack - which is exactly
      // what makes the `| undefined` in the response type of getValue() necessary
      const read = await book().Language().getValue().execute();
      expect(read.status).toBe(204);
      expect(read.data).toBeUndefined();
    });

    test("deleting a non-nullable value fails, and the server says so bluntly", async () => {
      // 500 rather than 400, with the database constraint showing through - not pretty, but it is what a
      // client has to deal with, and pinning it makes a future improvement visible.
      await expectODataError(book().Title().deleteValue().execute(), {
        status: 500,
        message: /NOT NULL constraint failed/,
      });
    });
  });

  describe("collection-valued property", () => {
    const SEED_KEYWORDS = ["Roman", "Klassiker", "Fragment"];

    // this block writes the collection, so it establishes its own starting point instead of relying on
    // the order in which the tests happen to run
    beforeAll(async () => {
      await book().Keywords().update(SEED_KEYWORDS).execute();
    });

    test("read the whole collection", async () => {
      const result = await book().Keywords().query().execute();

      expect(result.status).toBe(200);
      expect(result.data.value).toStrictEqual(SEED_KEYWORDS);
      /*
       * Not `<string>`: a collection-valued property is served as a collection of *wrapped* values, so
       * the generated service is typed on `StringCollection` - the same shape the q-object uses. Pinned
       * because it is a stumbling block for callers, who reasonably expect a plain string array.
       */
      expectTypeOf(result).toEqualTypeOf<HttpResponseModel<ODataCollectionResponseV4<StringCollection>>>();
    });

    test("replace the whole collection", async () => {
      /*
       * The payload has to be `{"value": [...]}`, not the bare array - odata2ts sent the array, and CAP
       * answered 204 while quietly leaving the collection *empty*. So this test is only meaningful with
       * the read-back below: the status alone looked fine while the data was gone.
       */
      const updated = await book().Keywords().update(["Testschlagwort"]).execute();
      expect(updated.status).toBe(200);

      expect((await book().Keywords().query().execute()).data.value).toStrictEqual(["Testschlagwort"]);
    });

    test("adding a single entry is refused", async () => {
      // CAP stores such a property as a plain array element rather than exposing it as an addressable
      // collection resource, so `add()` - a POST against that path - has nowhere to go.
      await expectODataError(book().Keywords().add<true>("Noch eins").execute(), {
        status: 405,
        message: /Method POST is not allowed/,
      });
    });
  });
});
