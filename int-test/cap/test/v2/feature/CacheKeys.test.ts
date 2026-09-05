import { touchesResource } from "@odata2ts/odata-service";
import { afterAll, describe, expect, test } from "vitest";
import { BOOK_DER_PROZESS, LIBRARY_V2 } from "../LibraryV2TestConstants.js";

/**
 * `cacheKeys: { mode: "on" }`, against CAP's V2 endpoint (the `@cap-js-community/odata-v2-adapter`
 * translation layer, same server and data as the V4 suite).
 *
 * The V4 suite (`../../feature/CacheKeys.test.ts`) already covers hop naming in general; this file's own
 * subject is V2 itself: the same navigation properties, keyed the same way, but built from V2's own URL and
 * filter-literal machinery, and - the one thing genuinely specific to V2 here - response-observed identity
 * proven against V2's `{d: {...}}`/`{d: {results: [...]}}` response envelope, which this client keeps
 * (`responseResultsWrapping: true`) rather than unwrapping.
 */
describe("CAP Library: cache keys (V2)", () => {
  const MEMBER_ID = 9860;
  // a pre-seeded copy of BOOK_DER_PROZESS, shared with the V4 suite (same database)
  const COPY = { MediumId: BOOK_DER_PROZESS, InventoryNumber: 1001 };

  afterAll(async () => {
    await LIBRARY_V2.Members(MEMBER_ID).delete().execute();
  });

  test("Members/Reservations names itself by the navigation property", async () => {
    const member = await LIBRARY_V2.Members()
      .create({
        Id: MEMBER_ID,
        Name: "CacheKeys Test (CAP, V2)",
        Reservations: [{ Member_Id: MEMBER_ID, ReservedAt: "2026-05-01T10:00:00Z" }],
      })
      .execute();
    expect(member.status).toBe(201);
    // the deep-inserted Reservation contributes its own bare entity-set entry too
    expect(member.invalidates).toEqual([
      ["Members", "list"],
      ["Reservations", "list"],
    ]);

    const request = LIBRARY_V2.Members(MEMBER_ID).Reservations().query();
    expect(request.cacheKey).toEqual(["Members", "detail", MEMBER_ID, "Reservations", "list"]);

    const result = await request.execute();
    expect(result.status).toBe(200);
    expect(result.data.d.results.length).toBe(1);
  });

  test("a to-one hop off a real entity - Loans(...)/Copy - names itself by the navigation property, with no key of its own", async () => {
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
    expect(request.cacheKey).toEqual(["Loans", "detail", loanId, "Copy", "detail"]);

    const result = await request.execute();
    expect(result.status).toBe(200);
  });

  test("touchesResource reaches a hierarchical key by its own name", () => {
    const key = LIBRARY_V2.Members(MEMBER_ID).Reservations().query().cacheKey!;
    expect(touchesResource(["Members", "detail", MEMBER_ID], key)).toBe(true);
    expect(touchesResource(["Reservations", "list"], key)).toBe(true);
    expect(touchesResource(["Loans", "list"], key)).toBe(false);
  });

  test("invalidates on a write through a hop reaches the ancestor too", async () => {
    const created = await LIBRARY_V2.Members(MEMBER_ID)
      .Reservations()
      .create({ Member_Id: MEMBER_ID, ReservedAt: "2026-05-02T10:00:00Z" })
      .execute();
    expect(created.status).toBe(201);
    const reservationId = created.data.d.Id;

    expect(created.invalidates).toEqual([
      ["Members", "detail", MEMBER_ID],
      ["Reservations", "list"],
    ]);

    const deleted = await LIBRARY_V2.Reservations(reservationId).delete().execute();
    expect(deleted.status).toBe(204);
    expect(deleted.invalidates).toEqual([
      ["Reservations", "detail", reservationId],
      ["Reservations", "list"],
    ]);
  });

  test("a read through a navigated route records the resource it served - against a V2-wrapped `{d: {results: [...]}}` response - so a later direct write also invalidates that route", async () => {
    const navigated = await LIBRARY_V2.Members(MEMBER_ID).Reservations().query().execute();
    expect(navigated.status).toBe(200);
    const reservationId = navigated.data.d.results[0].Id;

    const deleted = await LIBRARY_V2.Reservations(reservationId).delete().execute();
    expect(deleted.invalidates).toEqual(
      expect.arrayContaining([["Members", "detail", MEMBER_ID, "Reservations", "list"]]),
    );
  });

  test("$expand produces a hop-shaped entry touchesResource can reach", async () => {
    const request = LIBRARY_V2.Members(MEMBER_ID).query((builder) => builder.expand("Reservations"));
    expect(request.cacheKey).toEqual(["Members", "detail", MEMBER_ID, { expand: [["Reservations", "list"]] }]);
    expect(touchesResource(["Reservations", "list"], request.cacheKey!)).toBe(true);

    const result = await request.execute();
    expect(result.status).toBe(200);
  });
});
