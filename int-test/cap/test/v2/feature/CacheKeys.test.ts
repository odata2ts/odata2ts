import { touchesResource } from "@odata2ts/odata-service";
import { afterAll, describe, expect, test } from "vitest";
import { BOOK_DER_PROZESS, LIBRARY_V2 } from "../LibraryV2TestConstants.js";

/**
 * `cacheKeys: { mode: "typeFlattening" }`, against CAP's V2 endpoint (the
 * `@cap-js-community/odata-v2-adapter` translation layer, same server and data as the V4 suite).
 *
 * V4 hierarchical (`../../feature/CacheKeys.test.ts`) proves richer metadata makes no difference under
 * `hierarchical`; this file is the other half - the same richer metadata (`Partner` plus a real
 * `Member_Id` foreign key) is what lets `Members/Reservations` re-root *here*, exactly the relation that
 * stays hierarchical against ASP.NET's leaner V4 client. Both halves are `<Association>`-derived: V2 has
 * no `NavigationProperty/Partner` or inline `ReferentialConstraint` - `DataModelDigestionV2` reads them off
 * the `<Association>` element instead, and this is where that digestion is proven to actually reach a key.
 *
 * As in the V4 file, `Loans/Copy` is grade C, not the grade A the plan text originally assumed:
 * `<Association Name="Loans_Copy">`'s `ReferentialConstraint` names `Copy_MediumId`/`Copy_InventoryNumber`
 * as the dependent (`Loans`) side, and neither is part of `Loans`' own key (bare `Id`) - the same
 * usability check, reading the same digested fields, regardless of which schema language declared them.
 */
describe("CAP Library: cache keys (V2, typeFlattening)", () => {
  const MEMBER_ID = 9860;
  // a pre-seeded copy of BOOK_DER_PROZESS, shared with the V4 suite (same database)
  const COPY = { MediumId: BOOK_DER_PROZESS, InventoryNumber: 1001 };

  afterAll(async () => {
    await LIBRARY_V2.Members(MEMBER_ID).delete().execute();
  });

  test("entityTypeName is the entity set's FQ type", () => {
    expect(LIBRARY_V2.Members().entityTypeName).toBe("Library.Service.Members");
    expect(LIBRARY_V2.Reservations().entityTypeName).toBe("Library.Service.Reservations");
  });

  test("Members/Reservations re-roots here - the very relation that stays hierarchical against ASP.NET", async () => {
    const member = await LIBRARY_V2.Members()
      .create({
        Id: MEMBER_ID,
        Name: "CacheKeys Test (CAP, V2)",
        Reservations: [{ Member_Id: MEMBER_ID, ReservedAt: "2026-05-01T10:00:00Z" }],
      })
      .execute();
    expect(member.status).toBe(201);
    // the deep-inserted Reservation contributes its own bare-type entry too - deepEdit is unaffected by
    // typeFlattening, exactly like expand enrichment: neither depends on how a navigation hop itself keys
    expect(member.invalidates).toEqual([
      ["Library.Service.Members", "list"],
      ["Library.Service.Reservations", "list"],
    ]);

    const request = LIBRARY_V2.Members(MEMBER_ID).Reservations().query();
    // grade A, not B: Reservations' own "Member" nav carries a real ReferentialConstraint
    // (Member_Id -> Id), so the filter is a bare property on the target type rather than a navigation
    // path - and its value is the typed number, not any V2-rendered literal (decision 1 of the plan)
    expect(request.cacheKey).toEqual(["Library.Service.Reservations", "list", { filter: { Member_Id: MEMBER_ID } }]);

    const result = await request.execute();
    expect(result.status).toBe(200);
    expect(result.data.d.results.length).toBe(1);
  });

  test("Loans/Copy: a real ReferentialConstraint that is not usable, staying grade C in V2 too", async () => {
    const loan = await LIBRARY_V2.Members(MEMBER_ID)
      .Loans()
      .create({
        LoanedAt: "2026-05-01T10:00:00Z",
        DueDate: "2026-06-01",
        Member_Id: MEMBER_ID,
        Copy_MediumId: COPY.MediumId,
        Copy_InventoryNumber: COPY.InventoryNumber,
      })
      .execute();
    expect(loan.status).toBe(201);
    const loanId = loan.data.d.Id;

    const request = LIBRARY_V2.Loans(loanId).Copy().query();
    expect(request.cacheKey).toEqual([
      "Library.Service.Loans",
      "detail",
      loanId,
      "Library.Service.Copies",
      "detail",
      "Copy",
    ]);

    const result = await request.execute();
    expect(result.status).toBe(200);
  });

  test("touchesResource reaches a re-rooted key by its own type, not the ancestor it left", () => {
    const key = LIBRARY_V2.Members(MEMBER_ID).Reservations().query().cacheKey!;
    expect(touchesResource("Library.Service.Reservations", key)).toBe(true);
    expect(touchesResource("Library.Service.Members", key)).toBe(false);
  });

  test("invalidates on a write reaches through the re-rooted key's ancestor", async () => {
    const created = await LIBRARY_V2.Members(MEMBER_ID)
      .Reservations()
      .create({ Member_Id: MEMBER_ID, ReservedAt: "2026-05-02T10:00:00Z" })
      .execute();
    expect(created.status).toBe(201);
    const reservationId = created.data.d.Id;

    expect(created.invalidates).toEqual([
      ["Library.Service.Members", "detail", MEMBER_ID],
      ["Library.Service.Reservations", "list"],
    ]);

    const deleted = await LIBRARY_V2.Reservations(reservationId).delete().execute();
    expect(deleted.status).toBe(204);
    expect(deleted.invalidates).toEqual([
      ["Library.Service.Reservations", "detail", reservationId],
      ["Library.Service.Reservations", "list"],
    ]);
  });

  test("$expand produces a hop-shaped entry touchesResource can reach - unaffected by typeFlattening", async () => {
    const request = LIBRARY_V2.Members(MEMBER_ID).query((builder) => builder.expand("Reservations"));
    expect(request.cacheKey).toEqual([
      "Library.Service.Members",
      "detail",
      MEMBER_ID,
      { expand: [["Library.Service.Reservations", "list", "Reservations"]] },
    ]);
    expect(touchesResource("Library.Service.Reservations", request.cacheKey!)).toBe(true);

    const result = await request.execute();
    expect(result.status).toBe(200);
  });
});
