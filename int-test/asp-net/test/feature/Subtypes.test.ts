import { ODataCollectionResponseV4, ODataModelResponseV4 } from "@odata2ts/odata-core";
import { ODataResponseModel } from "@odata2ts/odata-service";
import { describe, expect, expectTypeOf, test } from "vitest";
import { Book, Medium } from "../../src-generated/library/library-catalog/index.js";
import { expectODataError } from "../expectODataError.js";
import { BASE_URL, BOOK_DER_PROZESS, LIBRARY } from "../LibraryTestConstants.js";

/**
 * Entity type inheritance: the type cast segment, and reaching properties that only a derived type has.
 *
 * The reference model is three levels deep (`Medium` → `PrintMedium` → `Book`), and only this server
 * reproduces it - CAP emits the hierarchy flat, without `BaseType`, so none of this exists there.
 *
 * Two distinct mechanisms are at play and they are easy to confuse:
 *
 * - the **cast service** (`asBookCollectionService()`) moves the request itself to the derived type, so
 *   the whole response is typed and served as `Book`
 * - the **cast q-property** (`QBook_PageCount`) reaches a derived type's property from a request that
 *   stays on the base type, which is what `$select` and `$filter` need
 */
describe("ASP.NET Library: subtypes", () => {
  test("cast segment on the collection narrows the set", async () => {
    const books = LIBRARY.Media().asBookCollectionService();

    expect(books.getPath()).toBe(`${BASE_URL}/Media/Library.Catalog.Book`);

    const result = await books.query().execute();

    expect(result.status).toBe(200);
    expect(result.data.value.length).toBeGreaterThan(0);
    // narrowed to the derived type, so every entry carries its properties
    expect(result.data.value.every((book) => typeof book.PageCount === "number")).toBe(true);
    expectTypeOf(result).toEqualTypeOf<ODataResponseModel<ODataCollectionResponseV4<Book>>>();
  });

  test("cast segment on a single entity is not served here", async () => {
    // odata2ts builds the URL the spec describes, and this server answers 404 for it while serving the
    // very same cast on the collection. Asserted rather than dropped, so the asymmetry stays visible -
    // and note that the *other* cast mechanisms below do work on a single entity.
    const book = LIBRARY.Media(BOOK_DER_PROZESS).asBookService();

    expect(book.getPath()).toBe(`${BASE_URL}/Media(${BOOK_DER_PROZESS})/Library.Catalog.Book`);
    expectTypeOf(book.query().execute).returns.resolves.toEqualTypeOf<ODataResponseModel<ODataModelResponseV4<Book>>>();

    await expectODataError(book.query().execute(), { status: 404, message: /No error message/ });
  });

  test("select a derived type's property without casting the request", async () => {
    // The request stays on `Media`; the derived property is addressed through the cast q-prop, which
    // renders as `Library.Catalog.Book/PageCount` in the URL.
    const request = LIBRARY.Media(BOOK_DER_PROZESS).query((builder) => builder.select("Title", "QBook_PageCount"));

    expect(request.getUrl()).toBe(
      `${BASE_URL}/Media(${BOOK_DER_PROZESS})?%24select=Title%2CLibrary.Catalog.Book%2FPageCount`,
    );

    const result = await request.execute();

    expect(result.status).toBe(200);
    expect(result.data.Title).toBe("Der Prozess");
    expect(result.data.Language).toBeUndefined();

    /*
     * The payload carries the plain property name - and the response *type* stays the base model, which
     * does not have it. So the value is reachable at runtime but not through the typing: a known gap of
     * the generator, pinned here rather than hidden behind a cast without explanation.
     */
    expect((result.data as unknown as Book).PageCount).toBe(320);
    expectTypeOf<Medium>().not.toHaveProperty("PageCount");
  });

  test("filter on a derived type's property", async () => {
    const result = await LIBRARY.Media()
      .query((builder, qMedium) => builder.filter(qMedium.QBook_PageCount.gt(200)))
      .execute();

    expect(result.status).toBe(200);
    expect(result.data.value.length).toBeGreaterThan(0);
    expect(result.data.value.map((medium) => medium.Title)).toContain("Der Prozess");
    // the request stayed on the base set, so that is what the response is typed as
    expectTypeOf(result).toEqualTypeOf<ODataResponseModel<ODataCollectionResponseV4<Medium>>>();
  });

  test("expand a navigation property that only the derived type has", async () => {
    // `Publisher` sits on `Book`, so reaching it from the `Media` set needs the cast q-prop as well
    const result = await LIBRARY.Media(BOOK_DER_PROZESS)
      .query((builder) => builder.select("Title").expand("QBook_Publisher"))
      .execute();

    expect(result.status).toBe(200);
    expect((result.data as unknown as Book).Publisher?.Name).toBeDefined();
  });

  test("create a derived entity through the cast collection service", async () => {
    const created = await LIBRARY.Media()
      .asBookCollectionService()
      .create({
        Title: "Integration Test Book",
        Language: "de",
        PageCount: 100,
        AgeRating: 0,
        ISBN: "9780000000001",
      })
      .execute();

    expect(created.status).toBe(201);
    expect(created.data.PageCount).toBe(100);
    expectTypeOf(created).toEqualTypeOf<ODataResponseModel<ODataModelResponseV4<Book>>>();

    await LIBRARY.Media(created.data.Id).delete().execute();
  });
});
