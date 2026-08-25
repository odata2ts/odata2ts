import { HttpResponseModel } from "@odata2ts/http-client-api";
import { ODataCollectionResponseV4, ODataModelResponseV4 } from "@odata2ts/odata-core";
import { afterAll, describe, expect, expectTypeOf, test } from "vitest";
import { Medium } from "../../src-generated/library-renamed/library-catalog/index.js";
import { Branch, Copy } from "../../src-generated/library-renamed/library-circulation/index.js";
import { PublisherBranch } from "../../src-generated/library-renamed/publisher-registry/index.js";
import { BASE_URL, BOOK_DER_PROZESS, BRANCH_CENTRAL, LIBRARY, LIBRARY_RENAMED } from "../LibraryTestConstants.js";

/**
 * `allowRenaming` against a running server.
 *
 * The option renames what the caller writes, never what is sent: the model reads `title`, the wire still
 * says `Title`. That makes it a mapping, and a mapping has two ends which both have to hold - in every
 * `$select`, `$filter` and `$orderby`, in the key predicate of a URL, in a request payload, and when the
 * response is read back into the renamed property.
 *
 * Which is why this is an integration test and not a fixture one: a fixture accepts a broken mapping just
 * as happily as a correct one, and so does `tsc`. Only a server rejects the wrong spelling - or, worse,
 * quietly answers something else. `LIBRARY_RENAMED` is the client generated with the option, `LIBRARY` the
 * one whose names are the server's own; having both is what makes the difference visible.
 */
describe("ASP.NET Library: renaming", () => {
  /** A copy only this file touches. */
  const RENAMED_COPY = 4101;
  const copyKey = (inventoryNumber: number) => ({ mediumId: BOOK_DER_PROZESS, inventoryNumber });

  afterAll(async () => {
    await LIBRARY_RENAMED.copies(copyKey(RENAMED_COPY)).delete().ignoreETag().execute();
  });

  test("the response is read back into the renamed properties", async () => {
    const result = await LIBRARY_RENAMED.media(BOOK_DER_PROZESS).query().execute();

    expect(result.status).toBe(200);
    // the server sent `Title` and `Language`; the model carries them under their renamed names
    expect(result.data.title).toBe("Der Prozess");
    expect(result.data.language).toBe("de");

    expectTypeOf(result).toEqualTypeOf<HttpResponseModel<ODataModelResponseV4<Medium>>>();
  });

  test("the URL keeps the OData names", async () => {
    // The renaming stops at the TypeScript surface: neither the entity set nor the key predicate changes.
    expect(LIBRARY_RENAMED.media(BOOK_DER_PROZESS).getPath()).toBe(`${BASE_URL}/Media(${BOOK_DER_PROZESS})`);
    expect(LIBRARY_RENAMED.mainBranch().getPath()).toBe(`${BASE_URL}/MainBranch`);
    // ... and it is the very same URL the un-renamed client builds
    expect(LIBRARY_RENAMED.media(BOOK_DER_PROZESS).getPath()).toBe(LIBRARY.Media(BOOK_DER_PROZESS).getPath());
  });

  test("$select sends the OData name", async () => {
    const result = await LIBRARY_RENAMED.media(BOOK_DER_PROZESS)
      .query((builder) => builder.select("title"))
      .execute();

    // A wrongly spelled `$select` would not narrow anything, so the assertion is that the *other*
    // properties are gone - not merely that this one arrived.
    expect(result.data.title).toBe("Der Prozess");
    expect(result.data.language).toBeUndefined();
    expect(result.data.publicationDate).toBeUndefined();
  });

  test("$filter and $orderby send the OData name", async () => {
    const result = await LIBRARY_RENAMED.media()
      .query((builder, qMedium) => builder.filter(qMedium.language.eq("de")).orderBy(qMedium.title.asc()))
      .execute();

    expect(result.data.value.length).toBeGreaterThan(0);
    expect(result.data.value.every((medium) => medium.language === "de")).toBe(true);

    const titles = result.data.value.map((medium) => medium.title);
    expect(titles).toStrictEqual([...titles].sort());

    expectTypeOf(result).toEqualTypeOf<HttpResponseModel<ODataCollectionResponseV4<Medium>>>();
  });

  test("a payload is written with the OData names", async () => {
    const created = await LIBRARY_RENAMED.copies()
      .create({
        mediumId: BOOK_DER_PROZESS,
        inventoryNumber: RENAMED_COPY,
        condition: 1,
        isLoanable: true,
        weightKg: 0.4,
        shelfLocation: "A-12",
      })
      .execute();

    expect(created.status).toBe(201);
    // read back through the *other* client: proves the value really landed in `Location_` on the server
    // and is not just an artefact of the renamed client talking to itself
    const raw = await LIBRARY.Copies({ MediumId: BOOK_DER_PROZESS, InventoryNumber: RENAMED_COPY }).query().execute();
    expect(raw.data.Location_).toBe("A-12");
  });

  test("a patch carries the renamed property through", async () => {
    const copy = LIBRARY_RENAMED.copies(copyKey(RENAMED_COPY));

    const patched = await copy.patch({ shelfLocation: "B-07" }).execute();
    expect(patched.status).toBe(204);

    expect((await copy.query().execute()).data.shelfLocation).toBe("B-07");
  });

  test("two OData names which camelCase would collapse stay apart", async () => {
    // `Location_` is the shelf mark, `Location` the branch an item sits in. Both would be `location`; the
    // config maps the former to `shelfLocation`, so each is separately addressable - and each has to reach
    // its own OData name, which is what a server can tell apart and a fixture cannot.
    const copy = LIBRARY_RENAMED.copies(copyKey(RENAMED_COPY));

    await copy.patch({ location: { "@id": BRANCH_CENTRAL } }).execute();

    const result = await copy.query((builder) => builder.expand("location")).execute();

    expect(result.data.shelfLocation).toBe("B-07");
    expect(result.data.location?.name).toBe("Central Library");

    expectTypeOf(result.data.shelfLocation).toEqualTypeOf<string | null>();
    expectTypeOf(result.data.location).toEqualTypeOf<Branch | null | undefined>();
  });

  test("a type renamed by hand keeps its own identity", async () => {
    // `Branch` exists in two namespaces; `byTypeAndName` gives the one in PublisherRegistry a name of its
    // own. Purely a generator concern - checked on the type level, since nothing about it reaches the wire.
    expectTypeOf<PublisherBranch>().not.toEqualTypeOf<Branch>();
    expectTypeOf<Copy["location"]>().toEqualTypeOf<Branch | null | undefined>();
  });
});
