import { describe, expect, expectTypeOf, test } from "vitest";
import { Book, Magazine, Medium, TradeJournal } from "../../src-generated/library/LibraryModel.js";
import { expectODataError } from "../expectODataError.js";
import { BOOK_DER_PROZESS, DVD_COPY_KEY, LIBRARY, TRADE_JOURNAL_NATURE } from "../LibraryTestConstants.js";

/**
 * Entity type inheritance - the reason this server exists next to the CAP one, and the only place any
 * odata2ts test suite meets it against a running server.
 *
 * The reference model's centrepiece is a four-level hierarchy, and no implementation measured so far has
 * been able to serve it: CAP has no entity inheritance in CDS at all, so it never renders one. Olingo
 * renders it exactly as declared - and then cannot serialize a derived instance through a set typed on
 * its base, which is why this server exposes one entity set per concrete type instead of a single
 * `Media` set. See test-server-olingo-v2's FEATURE-COVERAGE.md §1.
 *
 * So what is testable here is the half that works, plus the shape of the half that does not.
 */
describe("Olingo Library: entity type inheritance", () => {
  test("the generated model reproduces the whole chain", () => {
    // TradeJournal -> Magazine -> PrintMedium -> Medium, four levels, and the generated interfaces
    // inherit accordingly: every level's properties are reachable on the leaf type.
    expectTypeOf<TradeJournal>().toExtend<Magazine>();
    expectTypeOf<Magazine>().toExtend<Medium>();
    expectTypeOf<Book>().toExtend<Medium>();

    expectTypeOf<TradeJournal>().toHaveProperty("Field"); // its own
    expectTypeOf<TradeJournal>().toHaveProperty("IssueNumber"); // Magazine
    expectTypeOf<TradeJournal>().toHaveProperty("ISBN"); // PrintMedium
    expectTypeOf<TradeJournal>().toHaveProperty("Title"); // Medium
  });

  test("a four-level derived entity arrives complete and correctly typed", async () => {
    const result = await LIBRARY.TradeJournals(TRADE_JOURNAL_NATURE).query().execute();

    expect(result.status).toBe(200);
    // one property from each level of the hierarchy
    expect(result.data.d).toMatchObject({
      Field: "Multidisciplinary", // TradeJournal
      IssueNumber: 7965, // Magazine
      ISBN: "9770028083610", // PrintMedium
      Title: "Nature", // Medium
    });
    // and the payload names the leaf type, not the set's declared one
    expect(result.data.d.__metadata.type).toBe("Library.Catalog.TradeJournal");
  });

  test("the key is declared once, on the root, and inherited all the way down", async () => {
    // `Id` is declared on the abstract `Medium`, so the generated key type is `MediumId` for every
    // concrete media set - a Book, a TradeJournal and an Audiobook are all addressed the same way.
    expect(LIBRARY.TradeJournals(TRADE_JOURNAL_NATURE).getPath()).toMatch(
      /\/TradeJournals\(guid'33333333-3333-3333-3333-333333333331'\)$/,
    );
    expect(LIBRARY.Books(BOOK_DER_PROZESS).getPath()).toMatch(/\/Books\(guid'11111111/);
  });

  test("each concrete type has an entity set; the abstract ones do not", async () => {
    // The consequence of Olingo rendering inheritance but not serializing it. `Media` - a single set
    // over the abstract `Medium` - is what the reference model declares and what this server cannot
    // serve, so the six concrete sets replace it. All six answer.
    // each collection service is typed on its own concrete type, so they are queried one by one
    // rather than through a union - which is itself the point being made
    for (const query of [
      () => LIBRARY.Books().query().execute(),
      () => LIBRARY.Magazines().query().execute(),
      () => LIBRARY.TradeJournals().query().execute(),
      () => LIBRARY.Audiobooks().query().execute(),
      () => LIBRARY.DVDs().query().execute(),
      () => LIBRARY.EBooks().query().execute(),
    ]) {
      const result = await query();
      expect(result.status).toBe(200);
      expect(Array.isArray(result.data.d.results)).toBe(true);
    }

    // `Media` is not part of the generated service at all - the metadata never mentions it
    expect((LIBRARY as unknown as Record<string, unknown>).Media).toBeUndefined();
  });

  test("the reverse navigation to a medium reaches books only", async () => {
    /*
     * `Copy.Medium` is the other side of `Medium_Copies`. With one entity set per concrete type there is
     * no single set for it to point at, and the association set binds it to `Books` - so the navigation
     * resolves for a copy of a book and 404s for a copy of anything else.
     *
     * Asserted rather than skipped: this is the sharpest edge of the table-per-leaf-class layout, and a
     * client cannot see it coming from `$metadata`, which describes one navigation property.
     */
    const ofABook = await LIBRARY.Copies({ MediumId: BOOK_DER_PROZESS, InventoryNumber: 1001 })
      .Medium()
      .query()
      .execute();
    expect(ofABook.status).toBe(200);
    expect(ofABook.data.d.Title).toBe("Der Prozess");

    await expectODataError(LIBRARY.Copies(DVD_COPY_KEY).Medium().query().execute(), {
      status: 404,
      message: /could not be found/,
    });
  });
});
