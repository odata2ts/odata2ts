import { describe, expect, expectTypeOf, test } from "vitest";
import { Book, Branch, Copy, Member } from "../../src-generated/library/LibraryModel.js";
import { expectODataError } from "../expectODataError.js";
import { BOOK_DER_PROZESS, COPY_KEY, LIBRARY } from "../LibraryTestConstants.js";

/**
 * How the values arrive over V2, from a server that implements the format natively.
 *
 * The interest here is confirmation rather than discovery: the CAP V2 adapter already showed what V2's
 * JSON does with each type, and this file checks the same expectations against an independent
 * implementation. Where the two agree, the behaviour is V2's. Where odata2ts disagrees with *both*, the
 * mapping is odata2ts' - which is the case for exactly one type, pinned in the last test.
 */
describe("Olingo Library: data types", () => {
  test("the numeric types that do not fit a JS number arrive as strings", async () => {
    const book = (await LIBRARY.Books(BOOK_DER_PROZESS).query().execute()).data.d;
    // Edm.Double
    expect(book.PopularityScore).toBe("87.5");
    expectTypeOf<Book["PopularityScore"]>().toEqualTypeOf<string | null>();

    const branch = (await LIBRARY.Branches(1).query().execute()).data.d;
    // Edm.Int64
    expect(branch.Population).toBe("1841000");
    expectTypeOf<Branch["Population"]>().toEqualTypeOf<string | null>();

    const member = (await LIBRARY.Members(1).query().execute()).data.d;
    // Edm.Decimal - the whole reason for the string: 0.00 must not become 0
    expect(member.Balance).toBe("0.00");
    expectTypeOf<Member["Balance"]>().toEqualTypeOf<string | null>();

    const copy = (await LIBRARY.Copies(COPY_KEY).query().execute()).data.d;
    // Edm.Single
    expect(copy.WeightKg).toBe("0.31");

    // the ones that do fit stay numbers
    expect(book.PageCount).toBe(224);
    expectTypeOf<Book["PageCount"]>().toEqualTypeOf<number | null>();
  });

  test("a filter over a string-typed number is still written as a number", async () => {
    const cmd = LIBRARY.Books().query((b, q) => b.filter(q.PopularityScore.gt("90")));
    expect(decodeURIComponent(cmd.getUrl())).toContain("$filter=PopularityScore gt 90");

    const result = await cmd.execute();
    expect(result.status).toBe(200);
    expect(result.data.d.results.every((book) => Number(book.PopularityScore) > 90)).toBe(true);
  });

  test("dates and times arrive as ticks and durations, not as ISO 8601", async () => {
    const book = (await LIBRARY.Books(BOOK_DER_PROZESS).query().execute()).data.d;

    // Edm.Date in the V4 model, Edm.DateTime here - and a JSON value no one reads by eye
    expect(book.PublicationDate).toBe("/Date(-1410134400000)/");
    expect(new Date(-1410134400000).toISOString()).toBe("1925-04-26T00:00:00.000Z");
    expectTypeOf<Book["PublicationDate"]>().toEqualTypeOf<string | null>();

    // Edm.TimeOfDay in the V4 model, Edm.Time here - which V2 serialises as a duration since midnight
    const branch = (await LIBRARY.Branches(1).query().execute()).data.d;
    expect(branch.OpensAt).toBe("PT9H0M0S");

    // Edm.DateTimeOffset
    const member = (await LIBRARY.Members(1).query().execute()).data.d;
    expect(member.ActiveSince).toMatch(/^\/Date\(-?\d+\)\/$/);
  });

  test("the value read back cannot be fed straight into a filter", async () => {
    /*
     * The trap, and the two V2 servers disagree about it. `/Date(-1410134400000)/` is what the payload
     * carries, so it is the obvious thing to pass back to `eq()` - but the V2 *URI* literal format is
     * `datetime'1925-04-26T00:00:00'`, and the two are not interchangeable. Olingo enforces that and
     * rejects the round-tripped form with 400; the CAP V2 adapter accepts it (see
     * int-test/cap/test/v2/feature/DataTypes.test.ts).
     *
     * Olingo is the one following the spec here, which makes this the sharper behaviour to code against:
     * a client that round-trips the value works against one V2 server and breaks against the other.
     */
    await expectODataError(
      LIBRARY.Books()
        .query((b, q) => b.filter(q.PublicationDate.eq("/Date(-1410134400000)/")))
        .execute(),
      { status: 400, message: /Invalid filter expression/ },
    );

    // the canonical literal is what works
    const result = await LIBRARY.Books()
      .query((b, q) => b.filter(q.PublicationDate.eq("1925-04-26T00:00:00")))
      .execute();

    expect(result.data.d.results.map((book) => book.Title)).toStrictEqual(["Der Prozess"]);
  });

  test("a guid is bare in the payload and typed in the URL", async () => {
    const book = (await LIBRARY.Books(BOOK_DER_PROZESS).query().execute()).data.d;

    expect(book.Id).toBe(BOOK_DER_PROZESS);
    expect(
      decodeURIComponent(
        LIBRARY.Books()
          .query((b, q) => b.filter(q.Id.eq(BOOK_DER_PROZESS)))
          .getUrl(),
      ),
    ).toContain(`$filter=Id eq guid'${BOOK_DER_PROZESS}'`);
  });

  test("a complex property is nested and names its own type", async () => {
    const member = (await LIBRARY.Members(1).query().execute()).data.d;

    expect(member.Address).toMatchObject({ Street: "Lindenweg 4", City: "Hamburg", Country: "DE" });
    // the complex value carries `__metadata.type`, unlike in V4 where nothing marks it
    expect((member.Address as unknown as { __metadata: { type: string } }).__metadata.type).toBe(
      "Library.Catalog.PostalAddress",
    );
  });

  test("Edm.Byte is typed as a string but delivered as a number", async () => {
    /*
     * The one place odata2ts disagrees with V2 itself, and the reason this test is worth repeating on a
     * second server: `DataModelDigestionV2.mapODataType` groups `Edm.Byte` and `Edm.SByte` with the
     * string-serialised numeric types, while V2's JSON format puts them among the plain numbers.
     *
     * The CAP V2 adapter showed the same thing. Two independent V2 implementations agreeing against the
     * client settles where the bug is: `book.AgeRating === "16"` is `false` although the compiler says
     * both sides are strings.
     */
    const book = (await LIBRARY.Books(BOOK_DER_PROZESS).query().execute()).data.d;
    expectTypeOf<Book["AgeRating"]>().toEqualTypeOf<string | null>();
    expect(typeof (book.AgeRating as unknown)).toBe("number");
    expect(book.AgeRating as unknown).toBe(16);

    // same for Edm.SByte
    const branch = (await LIBRARY.Branches(1).query().execute()).data.d;
    expectTypeOf<Branch["LowestFloor"]>().toEqualTypeOf<string | null>();
    expect(branch.LowestFloor as unknown).toBe(-2);

    // and on another entity, to show it is the type and not the property
    const copy = (await LIBRARY.Copies(COPY_KEY).query().execute()).data.d;
    expectTypeOf<Copy["Condition"]>().toEqualTypeOf<string | null>();
    expect(typeof (copy.Condition as unknown)).toBe("number");
  });
});
