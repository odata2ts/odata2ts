import { HttpResponseModel } from "@odata2ts/http-client-api";
import { ODataCollectionResponseV4, ODataModelResponseV4 } from "@odata2ts/odata-core";
import { describe, expect, expectTypeOf, test } from "vitest";
import {
  Audiobook,
  AudioMedium,
  Book,
  CollectorsItem,
  DVD as DVDModel,
  EBook,
  Magazine,
  Medium,
  PrintMedium,
  TradeJournal,
} from "../../src-generated/library/library-catalog/index.js";
import { expectODataError } from "../expectODataError.js";
import {
  AUDIOBOOK,
  BASE_URL,
  BOOK_DER_PROZESS,
  COLLECTORS_ITEM,
  DVD,
  EBOOK,
  LIBRARY,
  MAGAZINE,
  TRADE_JOURNAL,
  UNKNOWN_ID,
} from "../LibraryTestConstants.js";

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
    expectTypeOf(result).toEqualTypeOf<HttpResponseModel<ODataCollectionResponseV4<Book>>>();
  });

  test("cast segment on a single entity re-types it", async () => {
    // The same cast the collection serves, after the key: the request is a plain GET and the response
    // is the one entity, typed as the derived type.
    const book = LIBRARY.Media(BOOK_DER_PROZESS).asBookService();

    expect(book.getPath()).toBe(`${BASE_URL}/Media(${BOOK_DER_PROZESS})/Library.Catalog.Book`);
    expectTypeOf(book.query().execute).returns.resolves.toEqualTypeOf<HttpResponseModel<ODataModelResponseV4<Book>>>();

    const result = await book.query().execute();

    expect(result.status).toBe(200);
    expect(result.data.Title).toBe("Der Prozess");
    expect(result.data.PageCount).toBe(320);
  });

  test("every derived type answers its own single-entity cast", async () => {
    // One seed entity per concrete type, and the two abstract intermediates through the entities that
    // are of them. Each result is pinned to its own type: a cast typed as the base `Medium` - or as a
    // different derived type - would pass the status and fail the shape.
    const book = await LIBRARY.Media(BOOK_DER_PROZESS).asBookService().query().execute();
    expect(book.status).toBe(200);
    expectTypeOf(book).toEqualTypeOf<HttpResponseModel<ODataModelResponseV4<Book>>>();

    const printMedium = await LIBRARY.Media(BOOK_DER_PROZESS).asPrintMediumService().query().execute();
    expect(printMedium.status).toBe(200);
    expectTypeOf(printMedium).toEqualTypeOf<HttpResponseModel<ODataModelResponseV4<PrintMedium>>>();

    const magazine = await LIBRARY.Media(MAGAZINE).asMagazineService().query().execute();
    expect(magazine.status).toBe(200);
    expectTypeOf(magazine).toEqualTypeOf<HttpResponseModel<ODataModelResponseV4<Magazine>>>();

    const tradeJournal = await LIBRARY.Media(TRADE_JOURNAL).asTradeJournalService().query().execute();
    expect(tradeJournal.status).toBe(200);
    expectTypeOf(tradeJournal).toEqualTypeOf<HttpResponseModel<ODataModelResponseV4<TradeJournal>>>();

    const audioMedium = await LIBRARY.Media(AUDIOBOOK).asAudioMediumService().query().execute();
    expect(audioMedium.status).toBe(200);
    expectTypeOf(audioMedium).toEqualTypeOf<HttpResponseModel<ODataModelResponseV4<AudioMedium>>>();

    const audiobook = await LIBRARY.Media(AUDIOBOOK).asAudiobookService().query().execute();
    expect(audiobook.status).toBe(200);
    expectTypeOf(audiobook).toEqualTypeOf<HttpResponseModel<ODataModelResponseV4<Audiobook>>>();

    const dvd = await LIBRARY.Media(DVD).asDVDService().query().execute();
    expect(dvd.status).toBe(200);
    expectTypeOf(dvd).toEqualTypeOf<HttpResponseModel<ODataModelResponseV4<DVDModel>>>();

    const eBook = await LIBRARY.Media(EBOOK).asEBookService().query().execute();
    expect(eBook.status).toBe(200);
    expectTypeOf(eBook).toEqualTypeOf<HttpResponseModel<ODataModelResponseV4<EBook>>>();

    const collectorsItem = await LIBRARY.Media(COLLECTORS_ITEM).asCollectorsItemService().query().execute();
    expect(collectorsItem.status).toBe(200);
    expectTypeOf(collectorsItem).toEqualTypeOf<HttpResponseModel<ODataModelResponseV4<CollectorsItem>>>();
  });

  test("the abstract intermediate cast serves the concrete entity behind it", async () => {
    const result = await LIBRARY.Media(BOOK_DER_PROZESS).asPrintMediumService().query().execute();

    expect(result.status).toBe(200);
    expectTypeOf(result).toEqualTypeOf<HttpResponseModel<ODataModelResponseV4<PrintMedium>>>();
    // the payload is a Book, so the Book-only properties come back at runtime ...
    expect((result.data as unknown as Book).PageCount).toBe(320);
    // ... while the type says PrintMedium, which does not have them
    expectTypeOf<PrintMedium>().not.toHaveProperty("PageCount");
  });

  test("a cast the entity is not of is a missing resource, not an empty one", async () => {
    // OData V4.01 Part 2, §4.11: the cast segment is part of the resource path, and a path that does
    // not resolve is an error.
    const magazineAsBook = LIBRARY.Media(MAGAZINE).asBookService();

    await expectODataError(magazineAsBook.query().execute(), { status: 404, message: /No error message/ });
    // a navigation behind the failed cast fails with it
    await expectODataError(magazineAsBook.Copies().query().execute(), { status: 404, message: /No error message/ });
    // and so does an unknown key behind a cast
    await expectODataError(LIBRARY.Media(UNKNOWN_ID).asBookService().query().execute(), {
      status: 404,
      message: /No error message/,
    });
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
    expectTypeOf(result).toEqualTypeOf<HttpResponseModel<ODataCollectionResponseV4<Medium>>>();
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
    expectTypeOf(created).toEqualTypeOf<HttpResponseModel<ODataModelResponseV4<Book>>>();

    await LIBRARY.Media(created.data.Id).delete().execute();
  });

  test("every derived type narrows the collection through its cast", async () => {
    // The Book cast is covered by the first test; the other eight, incl. the two abstract
    // intermediates, which narrow to their concrete subtypes. As on the single entity, each result is
    // pinned to its own type.
    const printMediums = await LIBRARY.Media().asPrintMediumCollectionService().query().execute();
    expect(printMediums.status).toBe(200);
    expect(printMediums.data.value.length).toBeGreaterThan(0);
    expectTypeOf(printMediums).toEqualTypeOf<HttpResponseModel<ODataCollectionResponseV4<PrintMedium>>>();

    const magazines = await LIBRARY.Media().asMagazineCollectionService().query().execute();
    expect(magazines.status).toBe(200);
    expect(magazines.data.value.length).toBeGreaterThan(0);
    expectTypeOf(magazines).toEqualTypeOf<HttpResponseModel<ODataCollectionResponseV4<Magazine>>>();

    const tradeJournals = await LIBRARY.Media().asTradeJournalCollectionService().query().execute();
    expect(tradeJournals.status).toBe(200);
    expect(tradeJournals.data.value.length).toBeGreaterThan(0);
    expectTypeOf(tradeJournals).toEqualTypeOf<HttpResponseModel<ODataCollectionResponseV4<TradeJournal>>>();

    const audioMediums = await LIBRARY.Media().asAudioMediumCollectionService().query().execute();
    expect(audioMediums.status).toBe(200);
    expect(audioMediums.data.value.length).toBeGreaterThan(0);
    expectTypeOf(audioMediums).toEqualTypeOf<HttpResponseModel<ODataCollectionResponseV4<AudioMedium>>>();

    const audiobooks = await LIBRARY.Media().asAudiobookCollectionService().query().execute();
    expect(audiobooks.status).toBe(200);
    expect(audiobooks.data.value.length).toBeGreaterThan(0);
    expectTypeOf(audiobooks).toEqualTypeOf<HttpResponseModel<ODataCollectionResponseV4<Audiobook>>>();

    const dvds = await LIBRARY.Media().asDVDCollectionService().query().execute();
    expect(dvds.status).toBe(200);
    expect(dvds.data.value.length).toBeGreaterThan(0);
    expectTypeOf(dvds).toEqualTypeOf<HttpResponseModel<ODataCollectionResponseV4<DVDModel>>>();

    const eBooks = await LIBRARY.Media().asEBookCollectionService().query().execute();
    expect(eBooks.status).toBe(200);
    expect(eBooks.data.value.length).toBeGreaterThan(0);
    expectTypeOf(eBooks).toEqualTypeOf<HttpResponseModel<ODataCollectionResponseV4<EBook>>>();

    const collectorsItems = await LIBRARY.Media().asCollectorsItemCollectionService().query().execute();
    expect(collectorsItems.status).toBe(200);
    expect(collectorsItems.data.value.length).toBeGreaterThan(0);
    expectTypeOf(collectorsItems).toEqualTypeOf<HttpResponseModel<ODataCollectionResponseV4<CollectorsItem>>>();
  });

  test("write verbs go through the cast, and the cast is checked on each of them", async () => {
    // The write entity is created for this test and deleted at the end, so none of the seed data
    // moves under the other tests. The Keywords collection exists before the PUT on purpose: it is the
    // assertion that a PUT replaces the state rather than carrying the omitted collection over.
    const created = await LIBRARY.Media()
      .asBookCollectionService()
      .create({
        Title: "Cast Cycle Book",
        Language: "de",
        PageCount: 100,
        AgeRating: 0,
        ISBN: "9780000000002",
        Keywords: ["Cast Cycle Keyword"],
      })
      .execute();
    expect(created.status).toBe(201);
    expectTypeOf(created).toEqualTypeOf<HttpResponseModel<ODataModelResponseV4<Book>>>();
    expect(created.data.Keywords).toEqual(["Cast Cycle Keyword"]);
    const book = LIBRARY.Media(created.data.Id).asBookService();

    // PATCH through the cast. With the cast path segment, the route names the concrete type, so the
    // payload carries no type control info.
    const patched = await book.patch({ PageCount: 350 }, { withCastPathSegment: true }).execute();
    expect(patched.status).toBe(204);
    expectTypeOf(patched).toEqualTypeOf<HttpResponseModel<undefined>>();

    // PUT through the cast: the same replace, over the cast route.
    const put = await book
      .update(
        { Title: "Cast Cycle Book (PUT)", Language: "de", PageCount: 320, AgeRating: 0, ISBN: "9780000000002" },
        { withCastPathSegment: true },
      )
      .execute();
    expect(put.status).toBe(204);
    expectTypeOf(put).toEqualTypeOf<HttpResponseModel<undefined>>();

    const readBack = await book.query((builder) => builder.select("Title", "PageCount", "Keywords")).execute();
    expect(readBack.status).toBe(200);
    expectTypeOf(readBack).toEqualTypeOf<HttpResponseModel<ODataModelResponseV4<Book>>>();
    expect(readBack.data.Title).toBe("Cast Cycle Book (PUT)");
    expect(readBack.data.PageCount).toBe(320);
    // the PUT replaced the state, so the collection the payload omitted is reset - not carried over
    expect(readBack.data.Keywords).toEqual([]);

    // PUT without the cast path segment goes to the base route, and the payload names the concrete
    // type there, as every payload on this abstract-typed set does.
    const putOnBase = await LIBRARY.Media(created.data.Id)
      .asBookService()
      .update({
        Title: "Cast Cycle Book (PUT auf Basis)",
        Language: "de",
        PageCount: 320,
        AgeRating: 0,
        ISBN: "9780000000002",
      })
      .execute();
    expect(putOnBase.status).toBe(204);
    expectTypeOf(putOnBase).toEqualTypeOf<HttpResponseModel<undefined>>();

    // DELETE through the cast.
    const deleted = await book.delete().execute();
    expect(deleted.status).toBe(204);
    expectTypeOf(deleted).toEqualTypeOf<HttpResponseModel<undefined>>();
    await expectODataError(LIBRARY.Media(created.data.Id).asBookService().query().execute(), {
      status: 404,
      message: /No error message/,
    });
  });

  test("a write verb refuses a cast the entity is not of", async () => {
    // The cast is part of the resource path for every verb, not just GET: a PUT that would replace a
    // magazine under a Book route is refused, and the magazine is left alone.
    await expectODataError(
      LIBRARY.Media(MAGAZINE)
        .asBookService()
        .update({ Title: "Nicht ein Buch", PageCount: 1, AgeRating: 0 }, { withCastPathSegment: true })
        .execute(),
      { status: 404, message: /No error message/ },
    );

    const stillAMagazine = await LIBRARY.Media(MAGAZINE).asMagazineService().query().execute();
    expect(stillAMagazine.status).toBe(200);
    expectTypeOf(stillAMagazine).toEqualTypeOf<HttpResponseModel<ODataModelResponseV4<Magazine>>>();
    // and its content is the seed's, not the refused payload's
    expect(stillAMagazine.data.Title).toBe("Stadtmagazin");
  });
});
