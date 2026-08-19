import { describe, expect, expectTypeOf, test } from "vitest";
import { Amenities, AvailabilityStatus } from "../../src-generated/library/library-catalog/index.js";
import { EditableMember } from "../../src-generated/library/library-circulation/index.js";
import { expectODataError } from "../expectODataError.js";
import { BOOK_DER_PROZESS, LIBRARY } from "../LibraryTestConstants.js";

/**
 * Data types, round tripped through a real server.
 *
 * `packages/odata2ts` proves that a type is *mapped* to the right TypeScript type, and the query builder
 * tests prove how it is *formatted* into a URL. Neither shows whether a value survives a write and a read
 * against a server - which is what the generated model claims by its typing.
 */
describe("ASP.NET Library: data types", () => {
  test("guid, int, boolean, double, enum and date round trip on a copy", async () => {
    const inventoryNumber = 7101;
    const key = { MediumId: BOOK_DER_PROZESS, InventoryNumber: inventoryNumber };

    const created = await LIBRARY.Copies()
      .create({
        // Edm.Guid, as part of a composite key
        MediumId: BOOK_DER_PROZESS,
        // Edm.Int32
        InventoryNumber: inventoryNumber,
        // Edm.Boolean
        IsLoanable: true,
        // Edm.Byte
        Condition: 2,
        // Edm.Double
        WeightKg: 0.375,
        // a string enum
        Status: AvailabilityStatus.InRepair,
        // Edm.Date - a string, deliberately not a Date object
        AcquisitionDate: "2026-08-02",
      })
      .execute();

    expect(created.status).toBe(201);

    const read = await LIBRARY.Copies(key).query().execute();

    expect(read.data).toMatchObject({
      MediumId: BOOK_DER_PROZESS,
      InventoryNumber: inventoryNumber,
      IsLoanable: true,
      Condition: 2,
      WeightKg: 0.375,
      Status: AvailabilityStatus.InRepair,
      AcquisitionDate: "2026-08-02",
    });
    expectTypeOf(read.data.IsLoanable).toEqualTypeOf<boolean>();
    expectTypeOf(read.data.WeightKg).toEqualTypeOf<number>();
    expectTypeOf(read.data.Status).toEqualTypeOf<AvailabilityStatus | null>();
    expectTypeOf(read.data.AcquisitionDate).toEqualTypeOf<string | null>();

    // A second copy with the same composite key is refused - which is what keeps a keyed read working at
    // all: two of them made the server answer "SingleResult must have zero or one elements" from then on.
    await expectODataError(
      LIBRARY.Copies()
        .create({
          MediumId: BOOK_DER_PROZESS,
          InventoryNumber: inventoryNumber,
          IsLoanable: true,
          Condition: 1,
          WeightKg: 1,
        })
        .execute(),
      { status: 409, message: /exists for this medium/ },
    );

    const deleted = await LIBRARY.Copies(key).delete().execute();
    expect(deleted.status).toBe(204);
  });

  test("dateTimeOffset and a complex collection round trip on a member", async () => {
    const member: EditableMember = {
      Name: "Data Type Member",
      // Edm.DateTimeOffset
      ActiveSince: "2026-01-15T08:30:00Z",
      // Collection of a complex type
      PreviousAddresses: [
        { Street: "Alte Straße 1", City: "Berlin", PostalCode: "10115", Country: "DE" },
        { Street: "Ältere Gasse 2", City: "Wien", PostalCode: "1010", Country: "AT" },
      ],
    };

    const created = await LIBRARY.Members().create(member).execute();
    expect(created.status).toBe(201);

    const read = await LIBRARY.Members(created.data.Id).query().execute();

    expect(read.data.ActiveSince).toContain("2026-01-15T08:30:00");
    expect(read.data.PreviousAddresses).toHaveLength(2);
    // including the non-ASCII characters, which is a question of encoding all the way through
    expect(read.data.PreviousAddresses?.[1].Street).toBe("Ältere Gasse 2");

    // `Balance` is Edm.Decimal but carries `Core.Permissions: Read`, so it is readable and nothing else -
    // the decimal *write* is round tripped on `Loan.LateFee` below instead
    expectTypeOf(read.data.Balance).toEqualTypeOf<number>();

    await LIBRARY.Members(created.data.Id).delete().execute();
  });

  test("decimal round trips on a loan's late fee", async () => {
    // a loan is created through its member: this server answers a POST to `/Loans` with 405
    const loanId = "77777777-7777-7777-7777-777777777701";
    const member = await LIBRARY.Members()
      .create({
        Name: "Late Fee Member",
        PreviousAddresses: [],
        Loans: [
          {
            Id: loanId,
            LoanedAt: "2026-03-01T09:00:00Z",
            DueDate: "2026-04-01",
            // Edm.Decimal, as a number - the V4 default unless v4BigNumberAsString is set
            LateFee: 12.34,
          },
        ],
      })
      .execute();
    expect(member.status).toBe(201);

    const read = await LIBRARY.Loans(loanId).query().execute();
    expect(read.data.LateFee).toBe(12.34);
    expectTypeOf(read.data.LateFee).toEqualTypeOf<number | null>();

    // deleting the member takes its loans with it - `Member.Loans` cascades, and `/Loans(…)` has no DELETE
    await LIBRARY.Members(member.data.Id).delete().execute();
  });

  test("guid and date round trip on a book", async () => {
    const created = await LIBRARY.Media()
      .asBookCollectionService()
      .create({
        Title: "Data Type Book",
        Language: "de",
        PublicationDate: "2026-08-02",
        PageCount: 10,
        AgeRating: 0,
        ISBN: "9780000000002",
      })
      .execute();

    // Edm.Guid, generated by the server
    expect(created.data.Id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-/i);
    expectTypeOf(created.data.Id).toEqualTypeOf<string>();

    const read = await LIBRARY.Media(created.data.Id).query().execute();
    expect(read.data.PublicationDate).toBe("2026-08-02");

    await LIBRARY.Media(created.data.Id).delete().execute();
  });

  test("a flags enum carries its non-ASCII member", async () => {
    // The reference model spells one member with an accent on purpose. Reading it back from a branch shows
    // it survives the wire; `Branches` accepts no POST here, so this stays a read.
    const read = await LIBRARY.Branches(1)
      .query((builder) => builder.select("Amenities"))
      .execute();

    expect(read.status).toBe(200);
    expect(Object.values(Amenities)).toContain("Café");
    expectTypeOf(read.data.Amenities).toEqualTypeOf<Amenities | null>();
  });

  test("a spatial value is typed as a string but arrives as GeoJSON", async () => {
    // The generator has no spatial type: `Edm.GeographyPoint` becomes a string, while the server sends a
    // GeoJSON object. The typing is a promise the payload does not keep - pinned, because a caller who
    // trusts it and calls a string method gets a runtime surprise.
    const result = await LIBRARY.Branches(1)
      .query((builder) => builder.select("Location"))
      .execute();

    expectTypeOf(result.data.Location).toEqualTypeOf<string | null>();
    expect(typeof result.data.Location).toBe("object");
    expect(result.data.Location as unknown as Record<string, unknown>).toMatchObject({ type: "Point" });
  });
});
