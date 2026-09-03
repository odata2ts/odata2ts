import { HttpResponseModel } from "@odata2ts/http-client-api";
import { ODataModelResponseV4 } from "@odata2ts/odata-core";
import { touchesType } from "@odata2ts/odata-service";
import { afterAll, describe, expect, expectTypeOf, test } from "vitest";
import { Books } from "../../src-generated/library/LibraryModel.js";
import { BOOK_DER_PROZESS, LIBRARY } from "../LibraryTestConstants.js";

/**
 * `cacheKeys: { mode: "hierarchical" }`, against CAP's V4 endpoint.
 *
 * CAP declares *more* than the reference model asks: `Members/Loans` and `Members/Reservations` both
 * carry a real `Member_Id` foreign key and a `Partner`, which makes them grade A here - richer than
 * ASP.NET's leaner metadata, where `Loans` is grade B and `Reservations` grade C (see
 * `int-test/asp-net/test/feature/CacheKeys.test.ts`). Under `hierarchical` that richness must make **no**
 * difference: the same relations key exactly the same shape either way. That is the one claim this file
 * exists to prove; the shape itself is already the general subject of the ASP.NET suite.
 *
 * Two of the plan's originally-cited "grade A" examples for this server turned out not to be, once checked
 * against `getNavPropDerivation` (Task 12's own resolver, tested against this exact metadata file):
 * `Members/IdDocument` and `Loans/Copy` each declare a `ReferentialConstraint`, but the constrained
 * property (`IdDocument_Id`, `Copy_MediumId`/`Copy_InventoryNumber`) is never part of the *source's* own
 * key - `Members`' key is bare `Id`, `Loans`' is bare `Id` too - so rule 4's usability check fails and both
 * stay grade C. `hierarchical` does not care either way, but the test comments below say what is actually
 * true rather than repeat the plan's premise.
 */
describe("CAP Library: cache keys (V4, hierarchical)", () => {
  const MEMBER_ID = 9850;
  // a pre-seeded copy of BOOK_DER_PROZESS - Loans/Copy_* is non-nullable, so a loan must reference one
  const COPY = { MediumId: BOOK_DER_PROZESS, InventoryNumber: 1001 };

  afterAll(async () => {
    await LIBRARY.Members(MEMBER_ID).delete().execute();
  });

  test("entityTypeName is the entity set's FQ type", () => {
    expect(LIBRARY.Books().entityTypeName).toBe("Library.Service.Books");
    expect(LIBRARY.Members().entityTypeName).toBe("Library.Service.Members");
    expect(LIBRARY.Loans().entityTypeName).toBe("Library.Service.Loans");
  });

  test("Members/Loans keys hierarchically despite being grade A here", async () => {
    const member = await LIBRARY.Members()
      .create({
        Id: MEMBER_ID,
        Name: "CacheKeys Test (CAP, V4)",
        Loans: [
          {
            LoanedAt: "2026-05-01T10:00:00Z",
            DueDate: "2026-06-01",
            Member_Id: MEMBER_ID,
            Copy_MediumId: COPY.MediumId,
            Copy_InventoryNumber: COPY.InventoryNumber,
          },
        ],
      })
      .execute();
    expect(member.status).toBe(201);

    const request = LIBRARY.Members(MEMBER_ID).Loans().query();
    expect(request.cacheKey).toEqual([
      "Library.Service.Members",
      "detail",
      MEMBER_ID,
      "Library.Service.Loans",
      "list",
      "Loans",
    ]);

    const result = await request.execute();
    expect(result.status).toBe(200);
    expect(result.data.value.length).toBe(1);
  });

  test("Members/Reservations keys hierarchically despite being grade A here", async () => {
    const request = LIBRARY.Members(MEMBER_ID).Reservations().query();
    expect(request.cacheKey).toEqual([
      "Library.Service.Members",
      "detail",
      MEMBER_ID,
      "Library.Service.Reservations",
      "list",
      "Reservations",
    ]);

    const result = await request.execute();
    expect(result.status).toBe(200);
  });

  test("Members/IdDocument: a real ReferentialConstraint that is not usable, staying grade C either way", async () => {
    // IdDocument_Id is not part of Members' own key, so rule 4 never applies - proven against the real
    // resolver in Task 12's own unit tests. Non-contained (a real "IdDocuments" entity set backs it), so
    // it still carries an entitySetType, unlike a contained hop.
    const request = LIBRARY.Members(MEMBER_ID).IdDocument().query();
    expect(request.cacheKey).toEqual([
      "Library.Service.Members",
      "detail",
      MEMBER_ID,
      "Library.Service.IdDocuments",
      "detail",
      "IdDocument",
    ]);

    // 204: this member has no IdDocument at all - the request itself is still well-formed
    const result = await request.execute();
    expect(result.status).toBe(204);
  });

  test("touchesType reaches a hierarchical key by type", () => {
    const key = LIBRARY.Members(MEMBER_ID).Loans().query().cacheKey!;
    expect(touchesType("Library.Service.Members", key)).toBe(true);
    expect(touchesType("Library.Service.Loans", key)).toBe(true);
    expect(touchesType("Library.Service.Reservations", key)).toBe(false);
  });

  test("invalidates on a PATCH, a POST and a DELETE", async () => {
    const created = await LIBRARY.Books().create({ Title: "CacheKeys Probe", Language: "de" }).execute();
    expect(created.status).toBe(201);
    expect(created.invalidates).toEqual([["Library.Service.Books", "list"]]);
    expectTypeOf(created).toEqualTypeOf<HttpResponseModel<ODataModelResponseV4<Books>>>();
    const bookId = created.data.Id;

    // CAP's V4 endpoint answers a patch with 200 and the full entity, unlike ASP.NET's 204
    const patched = await LIBRARY.Books(bookId).patch({ Language: "en" }).execute();
    expect(patched.status).toBe(200);
    expect(patched.invalidates).toEqual([
      ["Library.Service.Books", "detail", bookId],
      ["Library.Service.Books", "list"],
    ]);

    const deleted = await LIBRARY.Books(bookId).delete().execute();
    expect(deleted.status).toBe(204);
    expect(deleted.invalidates).toEqual([
      ["Library.Service.Books", "detail", bookId],
      ["Library.Service.Books", "list"],
    ]);

    // a read carries nothing extra
    const read = await LIBRARY.Books(BOOK_DER_PROZESS).query().execute();
    expect(read.invalidates).toBeUndefined();
  });
});
