import { ODataCollectionResponseV2, ODataValueResponseV2 } from "@odata2ts/odata-core";
import { StringCollection } from "@odata2ts/odata-query-objects";
import { ODataResponseModel } from "@odata2ts/odata-service";
import { afterAll, describe, expect, expectTypeOf, test } from "vitest";
import { expectODataError } from "../../expectODataError.js";
import { BASE_URL, BOOK_DER_PROZESS, LIBRARY_V2 } from "../LibraryV2TestConstants.js";

/**
 * Services for individual properties over V2 - the `enablePrimitivePropertyServices` feature.
 *
 * Reading works and is typed correctly. **Writing destroys data.** A `PUT` against a property URL is
 * answered with 204 by this server and leaves the property `null` (or, for a collection-valued one, empty),
 * whatever the payload says - the value sent never arrives. Verified directly against the server with every
 * body shape V2 allows, so this is not odata2ts choosing the wrong one:
 *
 * - `{"Language": "en"}` (what odata2ts sends) - 204, value nulled
 * - `{"d": {"Language": "en"}}` - 204, value nulled
 * - `PUT .../Language/$value` with `text/plain` - 415
 *
 * The V4 endpoint of the same server honours all of these (see `test/feature/PropertyServices.test.ts`), so
 * the loss is introduced by the adapter. It is the most dangerous finding in this folder: the client gets a
 * success status for a write that silently deleted the value it was supposed to set. Every write below is
 * therefore asserted through a read-back - the status alone would have looked fine.
 *
 * The way through that works is the entity-level `patch`, which is also what the cleanup here uses.
 */
describe("CAP Library V2: property services", () => {
  const book = () => LIBRARY_V2.Books(BOOK_DER_PROZESS);
  const SEED_KEYWORDS = ["Roman", "Klassiker", "Fragment"];

  // the seed data is the contract the other files assert against, and the property writes below wipe it -
  // so it is put back the only way that works here
  afterAll(async () => {
    await book().patch({ Language: "de", Keywords: SEED_KEYWORDS }).execute();
  });

  describe("primitive property", () => {
    test("the property name is appended to the entity URL", () => {
      expect(book().Title().getPath()).toBe(`${BASE_URL}/Books(guid'${BOOK_DER_PROZESS}')/Title`);
    });

    test("read a single value", async () => {
      const result = await book().Title().getValue().execute();

      expect(result.status).toBe(200);
      // V2 keys the value by the property name inside `d`, where V4 uses a fixed `value` field
      expect(result.data.d.Title).toBe("Der Prozess");

      expectTypeOf(result).toEqualTypeOf<ODataResponseModel<ODataValueResponseV2<string>>>();
    });

    test("updating a single value reports success and deletes it", async () => {
      const updated = await book().Language().updateValue("en").execute();
      expect(updated.status).toBe(204);

      // not "en", and not the previous "de" either: reading a null value answers 204 with no body
      const read = await book().Language().getValue().execute();
      expect(read.status).toBe(204);
      expect(read.data).toBeUndefined();

      // and the entity agrees - the value is gone, not merely hidden from the property resource
      expect((await book().query().execute()).data.d.Language).toBeNull();
    });

    test("the entity-level patch is the way that works", async () => {
      const patched = await book().patch({ Language: "en" }).execute();
      expect(patched.status).toBe(200);

      expect((await book().Language().getValue().execute()).data.d.Language).toBe("en");
      expect((await book().query().execute()).data.d.Language).toBe("en");
    });

    test("delete a nullable value", async () => {
      const deleted = await book().Language().deleteValue().execute();
      expect(deleted.status).toBe(204);
      expectTypeOf(deleted).toEqualTypeOf<ODataResponseModel<undefined>>();

      const read = await book().Language().getValue().execute();
      expect(read.status).toBe(204);
      expect(read.data).toBeUndefined();
    });

    test("deleting a non-nullable value fails, and the server says so bluntly", async () => {
      // Same 500 with the database constraint showing through as over V4 - the adapter forwards the error
      // unchanged, so at least this one is not swallowed.
      await expectODataError(book().Title().deleteValue().execute(), {
        status: 500,
        message: /NOT NULL constraint failed/,
      });
    });
  });

  describe("collection-valued property", () => {
    test("reading it does not answer in the shape the generated service expects", async () => {
      // odata2ts types a collection-valued property as a collection response (`d.results`), which is what a
      // V2 server should send for `.../Keywords`. This one sends the value-response shape instead, keyed by
      // the property name - so `d.results` is undefined and the values sit in `d.Keywords`.
      await book().patch({ Keywords: SEED_KEYWORDS }).execute();

      const result = await book().Keywords().query().execute();

      expect(result.status).toBe(200);
      expectTypeOf(result).toEqualTypeOf<ODataResponseModel<ODataCollectionResponseV2<StringCollection>>>();

      expect(result.data.d.results).toBeUndefined();
      expect((result.data.d as unknown as { Keywords: Array<string> }).Keywords).toStrictEqual(SEED_KEYWORDS);
    });

    test("replacing the whole collection empties it", async () => {
      await book().patch({ Keywords: SEED_KEYWORDS }).execute();

      const updated = await book().Keywords().update(["Testschlagwort"]).execute();
      expect(updated.status).toBe(204);

      // the same silent loss as for a primitive property - 204, and the collection is empty
      expect((await book().query().execute()).data.d.Keywords).toStrictEqual([]);
    });

    test("adding a single entry is refused, without a word about why", async () => {
      // CAP stores such a property as a plain array element rather than as an addressable collection
      // resource, so a POST against that path has nowhere to go. Over V4 the server says as much ("Method
      // POST is not allowed"); here the adapter answers 400 with an error body carrying no message at all,
      // so what reaches the caller is the client's own fallback text.
      await expectODataError(book().Keywords().add("Noch eins").execute(), {
        status: 400,
        message: /No error message/,
      });
    });
  });
});
