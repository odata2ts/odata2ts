import { ODataResponseModel } from "@odata2ts/odata-service";
import { BigNumber } from "bignumber.js";
import { DateTime } from "luxon";
import { describe, expect, expectTypeOf, test } from "vitest";
import { Book, Branch, Copy, Member } from "../../src-generated/library-converted/LibraryConvertedModel.js";
import { expectODataError } from "../expectODataError.js";
import { CONVERTED } from "../LibraryConvertedConstants.js";
import { BOOK_DER_PROZESS, COPY_KEY, LIBRARY } from "../LibraryTestConstants.js";

/**
 * Value converters against a running V2 server - the combination that had never been tested anywhere.
 *
 * V2 is where converters earn their keep. Its JSON format hands over every timestamp as
 * `/Date(<ticks>)/` and every numeric type that does not fit a JS number as a string, so the raw client
 * types all of those as `string` and leaves the caller to parse them - which is exactly what
 * `feature/DataTypes.test.ts` pins. This file drives the same server through the converter-enabled
 * client generated from the second service configuration, and asserts what comes out instead.
 *
 * Both halves matter. `examples/main` covers the converted V2 model, but only against a mock client, so
 * until now nothing checked that a converted value survives a real request in either direction.
 */
describe("Olingo Library: value converters", () => {
  test("a timestamp becomes a DateTime rather than a tick count", async () => {
    const raw = (await LIBRARY.Books(BOOK_DER_PROZESS).query().execute()).data.d;
    const converted = (await CONVERTED.Books(BOOK_DER_PROZESS).query().execute()).data.d;

    // the same property, the same request, the two clients side by side
    expect(raw.PublicationDate).toBe("/Date(-1410134400000)/");
    expect(DateTime.isDateTime(converted.PublicationDate)).toBe(true);
    expect(converted.PublicationDate!.toUTC().toISO()).toContain("1925-04-26");

    expectTypeOf<Book["PublicationDate"]>().toEqualTypeOf<DateTime | null>();
  });

  test("the numeric types V2 sends as strings become numbers, BigNumber and bigint", async () => {
    const book = (await CONVERTED.Books(BOOK_DER_PROZESS).query().execute()).data.d;
    // Edm.Double - fits a JS number once parsed
    expect(book.PopularityScore).toBe(87.5);
    expectTypeOf<Book["PopularityScore"]>().toEqualTypeOf<number | null>();

    const member = (await CONVERTED.Members(1).query().execute()).data.d;
    // Edm.Decimal - the one that must not become a number, or 0.00 stops being 0.00
    expect(BigNumber.isBigNumber(member.Balance)).toBe(true);
    expect(member.Balance!.toFixed(2)).toBe("0.00");
    expectTypeOf<Member["Balance"]>().toEqualTypeOf<BigNumber | null>();

    const branch = (await CONVERTED.Branches(1).query().execute()).data.d;
    // Edm.Int64 - beyond a JS number's safe range in general, so a bigint
    expect(branch.Population).toBe(BigInt("1841000"));
    expectTypeOf<Branch["Population"]>().toEqualTypeOf<bigint | null>();

    const copy = (await CONVERTED.Copies(COPY_KEY).query().execute()).data.d;
    // Edm.Single
    expect(copy.WeightKg).toBeCloseTo(0.31, 5);
  });

  test("the converters correct the Edm.Byte mapping the raw client gets wrong", async () => {
    /*
     * `feature/DataTypes.test.ts` pins the raw client's divergence: `Edm.Byte` and `Edm.SByte` are typed
     * `string` by `DataModelDigestionV2` while V2's JSON format puts them among the plain numbers, so
     * the value that arrives is a number the compiler calls a string.
     *
     * With `@odata2ts/converter-v2-to-v4` in place the model says `number` and the value is a number, so
     * type and runtime agree again. Worth knowing which way round that is: the converter is not adding a
     * conversion here so much as repairing a mapping.
     */
    const book = (await CONVERTED.Books(BOOK_DER_PROZESS).query().execute()).data.d;
    expectTypeOf<Book["AgeRating"]>().toEqualTypeOf<number | null>();
    expect(book.AgeRating).toBe(16);

    const branch = (await CONVERTED.Branches(1).query().execute()).data.d;
    expectTypeOf<Branch["LowestFloor"]>().toEqualTypeOf<number | null>();
    expect(branch.LowestFloor).toBe(-2);

    const copy = (await CONVERTED.Copies(COPY_KEY).query().execute()).data.d;
    expectTypeOf<Copy["Condition"]>().toEqualTypeOf<number | null>();
    expect(typeof copy.Condition).toBe("number");
  });

  test("a converted date can be filtered on", async () => {
    /*
     * The direction that had never been tested: a `DateTime` going *out*. V2's `Edm.DateTime` literal is
     * timezone-less - its ABNF has no offset - while a converter hands back a full ISO string, `Z` and
     * all. `QDateTimeV2Path` therefore normalises the value to UTC and drops the designator, so what
     * reaches the server is a literal it accepts.
     */
    const cmd = CONVERTED.Books().query((b, q) =>
      b.filter(q.PublicationDate.eq(DateTime.fromISO("1925-04-26T00:00:00", { zone: "utc" }))),
    );
    expect(decodeURIComponent(cmd.getUrl())).toContain("$filter=PublicationDate eq datetime'1925-04-26T00:00:00'");

    const result = await cmd.execute();
    expect(result.data.d.results.map((book) => book.Title)).toStrictEqual(["Der Prozess"]);
  });

  test("a date given in another zone is normalised to the same instant", async () => {
    // the normalisation has to shift, not truncate: 02:00+02:00 is the same instant as 00:00Z, and the
    // literal V2 wants is the UTC one
    const cmd = CONVERTED.Books().query((b, q) =>
      b.filter(q.PublicationDate.eq(DateTime.fromISO("1925-04-26T02:00:00+02:00", { setZone: true }))),
    );
    expect(decodeURIComponent(cmd.getUrl())).toContain("datetime'1925-04-26T00:00:00'");

    expect((await cmd.execute()).data.d.results.map((book) => book.Title)).toStrictEqual(["Der Prozess"]);
  });

  test("a converted value survives a write and comes back converted", async () => {
    // the full round trip: DateTime in, ticks on the wire, DateTime out again
    const publicationDate = DateTime.fromISO("2001-02-03T00:00:00", { zone: "utc" });

    const created = await CONVERTED.Books()
      .create({ Title: "Converted Round Trip", Language: "de", PublicationDate: publicationDate })
      .execute();
    expect(created.status).toBe(201);

    const id = created.data.d.Id;
    const read = await CONVERTED.Books(id).query().execute();
    expect(read.data.d.PublicationDate!.toUTC().toISO()).toContain("2001-02-03");

    // and the raw client sees the ticks the server actually stored
    const raw = await LIBRARY.Books(id).query().execute();
    expect(raw.data.d.PublicationDate).toBe(`/Date(${publicationDate.toMillis()})/`);

    await CONVERTED.Books(id).delete().execute();
  });

  test("a converted date reaches a function parameter as a V2 literal, not as ticks", async () => {
    /*
     * A function parameter goes into the URL just like a filter value does, so the converter has to be
     * told that it is converting for a URL. Without that it produces V2's *body* format and the literal
     * becomes `datetime'/Date(1766534400000)/'` - which no V2 server accepts. The filter side above was
     * already covered; this is the same conversion reached through a QParam instead of a QPath.
     */
    const cmd = CONVERTED.ClosureDay({ Day: DateTime.fromISO("2026-12-24T00:00:00", { zone: "utc" }) });

    expect(decodeURIComponent(cmd.getUrl())).toContain("datetime'2026-12-24T00:00:00'");

    const result = await cmd.execute();
    expect(result.status).toBe(204);
    expect(result.data).toBeUndefined();
    expectTypeOf(result).toEqualTypeOf<ODataResponseModel<undefined>>();
  });

  test("a converted primitive property service converts too", async () => {
    // the property services are generated for the converted service as well, and go through the same
    // converter - so `getValue()` on a date yields a DateTime, not a tick string
    const result = await CONVERTED.Books(BOOK_DER_PROZESS).PublicationDate().getValue().execute();

    expect(result.status).toBe(200);
    expect(DateTime.isDateTime(result.data.d.PublicationDate)).toBe(true);
    expect(result.data.d.PublicationDate!.toUTC().toISO()).toContain("1925-04-26");
  });
});
