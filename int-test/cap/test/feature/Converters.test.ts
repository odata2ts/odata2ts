import { BigNumber } from "bignumber.js";
import { DateTime } from "luxon";
import { describe, expect, expectTypeOf, test } from "vitest";
import type { Books, Branches, Members } from "../../src-generated/library-converted/LibraryConvertedModel.js";
import { CONVERTED } from "../LibraryConvertedConstants.js";
import { BOOK_DER_PROZESS, LIBRARY } from "../LibraryTestConstants.js";

/**
 * Value converters against a running **V4** server.
 *
 * `int-test/olingo-v2` already drives them against V2, and that is a different problem: there a timestamp
 * arrives as `/Date(<ticks>)/` and every wide numeric type as a string, so the raw client types all of them
 * as `string` and the converter has something obvious to parse. V4 sends real ISO values - and types
 * `Edm.Decimal` and `Edm.Int64` as `number`, which is exactly where precision disappears without anyone
 * noticing.
 *
 * That is why `v4BigNumberAsString` is switched on together with the converters rather than as a variant of
 * its own: it asks the server for those two types as strings, and only then is there anything left for the
 * converter to preserve. The two options are meaningless apart.
 *
 * `LIBRARY` is the raw client and `CONVERTED` the converted one, driving the same server. Both are needed:
 * one shows what is actually sent, the other what the converters make of it.
 */
describe("CAP Library: value converters", () => {
  test("an Edm.Date becomes a DateTime rather than a string", async () => {
    const raw = (await LIBRARY.Books(BOOK_DER_PROZESS).query().execute()).data;
    const converted = (await CONVERTED.Books(BOOK_DER_PROZESS).query().execute()).data;

    // the same property, the same request, the two clients side by side
    expect(raw.PublicationDate).toBe("1925-04-26");
    expect(DateTime.isDateTime(converted.PublicationDate)).toBe(true);
    expect(converted.PublicationDate!.toISODate()).toBe("1925-04-26");

    expectTypeOf<Books["PublicationDate"]>().toEqualTypeOf<DateTime | null>();
  });

  test("Edm.Decimal survives as a BigNumber instead of a JS number", async () => {
    const member = (await CONVERTED.Members(1).query().execute()).data;

    // The point of the pairing: `v4BigNumberAsString` makes the server send this as a string, so the
    // converter gets the exact value rather than one which has already been through a double.
    expect(BigNumber.isBigNumber(member.Balance)).toBe(true);
    expect(member.Balance!.toFixed(2)).toBe("0.00");

    expectTypeOf<Members["Balance"]>().toEqualTypeOf<BigNumber.Instance | null>();
  });

  test("Edm.Int64 becomes a bigint", async () => {
    const branch = (await CONVERTED.Branches(1).query().execute()).data;

    expect(branch.Population).toBe(BigInt("1841000"));
    expectTypeOf<Branches["Population"]>().toEqualTypeOf<bigint | null>();
  });

  test("a converted value goes back out in the format the server expects", async () => {
    // The direction which a read-only test would never cover: the converter has to serialize as well, and
    // a server is the only judge of whether the result is acceptable.
    const created = await CONVERTED.Books()
      .create({
        Title: "Converter Round Trip",
        Language: "de",
        PublicationDate: DateTime.fromISO("2001-02-03"),
        PopularityScore: 1,
        Keywords: [],
      })
      .execute();

    expect(created.status).toBe(201);
    const id = created.data.Id;

    try {
      // read back through the raw client: proves the value landed on the server as an OData date, not as
      // whatever a DateTime happens to stringify to
      const raw = (await LIBRARY.Books(id).query().execute()).data;
      expect(raw.PublicationDate).toBe("2001-02-03");

      const readBack = (await CONVERTED.Books(id).query().execute()).data;
      expect(readBack.PublicationDate!.toISODate()).toBe("2001-02-03");
    } finally {
      await CONVERTED.Books(id).delete().execute();
    }
  });
});
