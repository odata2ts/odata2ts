import { describe, expect, expectTypeOf, test } from "vitest";
import { Books, Copies, MainBranch } from "../../../src-generated/library-v2/LibraryV2Model.js";
import { BOOK_DER_PROZESS, LIBRARY_V2 } from "../LibraryV2TestConstants.js";

/**
 * How the values themselves arrive over V2 - the part of this folder with the least in common with V4.
 *
 * V2's JSON format serialises the numeric types that do not fit a JavaScript number as **strings**, and
 * timestamps as `/Date(<ticks>)/`. odata2ts models that: `Edm.Int64`, `Edm.Decimal`, `Edm.Double` and
 * `Edm.Single` become `string`, and a date/time property becomes `string` as long as no converter is
 * configured (this package configures none, on purpose - the raw wire format is what is under test).
 *
 * That mapping is right everywhere except for `Edm.Byte`/`Edm.SByte`, which the last test pins.
 *
 * The type system of the model also shrinks on the way: `Edm.Date`, `Edm.TimeOfDay` and `Edm.Duration` have
 * no V2 counterparts and the adapter substitutes `Edm.DateTime`, `Edm.Time` and `Edm.String` for them.
 */
describe("CAP Library V2: data types", () => {
  test("the numeric types that do not fit a JS number arrive as strings", async () => {
    const book = (await LIBRARY_V2.Books(BOOK_DER_PROZESS).query().execute()).data.d;

    // Edm.Double
    expect(book.PopularityScore).toBe("87.5");
    expectTypeOf<Books["PopularityScore"]>().toEqualTypeOf<string | null>();

    const branch = (await LIBRARY_V2.MainBranch(1).query().execute()).data.d;
    // Edm.Int64
    expect(branch.Population).toBe("1841000");
    expectTypeOf<MainBranch["Population"]>().toEqualTypeOf<string | null>();

    const member = (await LIBRARY_V2.Members(1).query().execute()).data.d;
    // Edm.Decimal - the whole reason for the string: 0.00 must not become 0
    expect(member.Balance).toBe("0.00");

    const copy = (await LIBRARY_V2.Copies({ MediumId: BOOK_DER_PROZESS, InventoryNumber: 1001 }).query().execute()).data
      .d;
    // Edm.Single
    expect(copy.WeightKg).toBe("0.31");

    // the ones that do fit stay numbers
    expect(book.PageCount).toBe(224);
    expectTypeOf<Books["PageCount"]>().toEqualTypeOf<number | null>();
  });

  test("a filter over a string-typed number is still written as a number", async () => {
    // The value is a string in the model but a number in the URL - the q-object knows the difference, so a
    // caller filtering on `PopularityScore` passes the string they read back and gets valid OData.
    const cmd = LIBRARY_V2.Books().query((b, q) => b.filter(q.PopularityScore.gt("90")));
    expect(decodeURIComponent(cmd.getUrl())).toContain("$filter=PopularityScore gt 90");

    const result = await cmd.execute();
    expect(result.status).toBe(200);
    expect(result.data.d.results.every((book) => Number(book.PopularityScore) > 90)).toBe(true);
  });

  test("dates and timestamps arrive as ticks, not as ISO 8601", async () => {
    const book = (await LIBRARY_V2.Books(BOOK_DER_PROZESS).query().execute()).data.d;

    // Edm.Date in the V4 model, Edm.DateTime here - and a JSON value no one reads by eye
    expect(book.PublicationDate).toBe("/Date(-1410134400000)/");
    expect(new Date(-1410134400000).toISOString()).toBe("1925-04-26T00:00:00.000Z");
    expectTypeOf<Books["PublicationDate"]>().toEqualTypeOf<string | null>();

    // Edm.DateTimeOffset keeps its offset, appended to the ticks
    const member = (await LIBRARY_V2.Members(1).query().execute()).data.d;
    expect(member.ActiveSince).toMatch(/^\/Date\(\d+\+0000\)\/$/);

    // Edm.TimeOfDay in the V4 model, Edm.Time here - which V2 serialises as a duration since midnight
    const branch = (await LIBRARY_V2.MainBranch(1).query().execute()).data.d;
    expect(branch.OpensAt).toBe("PT09H00M00S");

    // Edm.Duration has no V2 counterpart at all and is declared Edm.String
    const audiobook = (
      await LIBRARY_V2.Audiobooks()
        .query((b) => b.top(1))
        .execute()
    ).data.d.results[0];
    expect(audiobook.Duration).toMatch(/^P/);
  });

  test("the value read back can be filtered on, in both notations", async () => {
    // `datetime'/Date(...)/' ` is not the V2 URI literal format, but it is what a caller who round-trips the
    // value they were given produces - and this server accepts it as readily as the canonical spelling.
    const byTicks = await LIBRARY_V2.Books()
      .query((b, q) => b.filter(q.PublicationDate.eq("/Date(-1410134400000)/")))
      .execute();
    const byLiteral = await LIBRARY_V2.Books()
      .query((b, q) => b.filter(q.PublicationDate.eq("1925-04-26T00:00:00")))
      .execute();

    expect(byTicks.data.d.results.map((book) => book.Title)).toStrictEqual(["Der Prozess"]);
    expect(byLiteral.data.d.results.map((book) => book.Title)).toStrictEqual(["Der Prozess"]);
  });

  test("a guid is bare in the payload and typed in the URL", async () => {
    const book = (await LIBRARY_V2.Books(BOOK_DER_PROZESS).query().execute()).data.d;

    expect(book.Id).toBe(BOOK_DER_PROZESS);
    expect(
      decodeURIComponent(
        LIBRARY_V2.Books()
          .query((b, q) => b.filter(q.Id.eq(BOOK_DER_PROZESS)))
          .getUrl(),
      ),
    ).toContain(`$filter=Id eq guid'${BOOK_DER_PROZESS}'`);
  });

  test("Edm.Byte is typed as a string but delivered as a number", async () => {
    /*
     * The one place where odata2ts's V2 type mapping and this server disagree. odata2ts groups `Edm.Byte`
     * and `Edm.SByte` with the string-serialised numeric types (`DataModelDigestionV2.mapODataType`), while
     * V2's JSON format puts them among the plain JSON numbers - which is what arrives here.
     *
     * The consequence is quiet and easy to trip over: `book.AgeRating === "16"` is `false` although the
     * compiler says both sides are strings, and any code doing string work on the value gets a number.
     * Writing is unaffected, since the server accepts either.
     */
    const book = (await LIBRARY_V2.Books(BOOK_DER_PROZESS).query().execute()).data.d;

    expectTypeOf<Books["AgeRating"]>().toEqualTypeOf<string | null>();
    expect(typeof (book.AgeRating as unknown)).toBe("number");
    expect(book.AgeRating as unknown).toBe(16);

    // same for Edm.SByte
    const branch = (await LIBRARY_V2.MainBranch(1).query().execute()).data.d;
    expectTypeOf<MainBranch["LowestFloor"]>().toEqualTypeOf<string | null>();
    expect(branch.LowestFloor as unknown).toBe(-2);

    // and for a byte on another entity, to show it is the type and not the property
    const copy = (await LIBRARY_V2.Copies({ MediumId: BOOK_DER_PROZESS, InventoryNumber: 1001 }).query().execute()).data
      .d;
    expectTypeOf<Copies["Condition"]>().toEqualTypeOf<string | null>();
    expect(typeof (copy.Condition as unknown)).toBe("number");
  });

  test("a structured element survives as a real complex type", async () => {
    // CAP's flat mode reaches V2 as it reaches V4 - `Address_City`, not `Address/City`. A collection of a
    // structured type is the exception in both versions: it stays a complex type, because there is no flat
    // spelling for it.
    const member = (await LIBRARY_V2.Members(1).query().execute()).data.d;

    expect(member.Address_City).toBe("Hamburg");
    expect(member.PreviousAddresses[0]).toMatchObject({ Street: "Alte Gasse 9", City: "Bremen" });

    const asComplex = await LIBRARY_V2.Members(1).PreviousAddresses().query().execute();
    expect(asComplex.status).toBe(200);
  });
});
