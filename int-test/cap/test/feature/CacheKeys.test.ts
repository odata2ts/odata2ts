import { HttpResponseModel } from "@odata2ts/http-client-api";
import { ODataModelResponseV4 } from "@odata2ts/odata-core";
import { touchesResource } from "@odata2ts/odata-service";
import { afterAll, describe, expect, expectTypeOf, test } from "vitest";
import { Books } from "../../src-generated/library/LibraryModel.js";
import { AUDIOBOOK, BOOK_DER_PROZESS, LIBRARY } from "../LibraryTestConstants.js";

/**
 * `cacheKeys: true`, against CAP's V4 endpoint.
 *
 * CAP declares *more* than the reference model asks: `Members/Loans` and `Members/Reservations` both carry
 * a real `Member_Id` foreign key and a `Partner`, richer than ASP.NET's leaner metadata. Since a cache key
 * is now purely the route taken, named, that richer metadata makes no difference to the key shape at all -
 * the point this file exists to prove; the shape itself is already the general subject of the ASP.NET
 * suite.
 */
describe("CAP Library: cache keys (V4)", () => {
  const MEMBER_ID = 9850;
  // a pre-seeded copy of BOOK_DER_PROZESS - Loans/Copy_* is non-nullable, so a loan must reference one
  const COPY = { MediumId: BOOK_DER_PROZESS, InventoryNumber: 1001 };

  afterAll(async () => {
    await LIBRARY.Members(MEMBER_ID).delete().execute();
  });

  test("Members/Loans names itself by the navigation property, never by its richer metadata", async () => {
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
    expect(request.cacheKey).toEqual(["Members", "detail", MEMBER_ID, "Loans", "list"]);

    const result = await request.execute();
    expect(result.status).toBe(200);
    expect(result.data.value.length).toBe(1);
  });

  test("Members/Reservations names itself the same way", async () => {
    const request = LIBRARY.Members(MEMBER_ID).Reservations().query();
    expect(request.cacheKey).toEqual(["Members", "detail", MEMBER_ID, "Reservations", "list"]);

    const result = await request.execute();
    expect(result.status).toBe(200);
  });

  test("Members/IdDocument names itself by the navigation property, not by its target entity set's name", async () => {
    const request = LIBRARY.Members(MEMBER_ID).IdDocument().query();
    expect(request.cacheKey).toEqual(["Members", "detail", MEMBER_ID, "IdDocument", "detail"]);

    // 204: this member has no IdDocument at all - the request itself is still well-formed
    const result = await request.execute();
    expect(result.status).toBe(204);
  });

  test("a read through a navigated route records the resource it served, so a later direct write to it also invalidates that route", async () => {
    const navigated = await LIBRARY.Members(MEMBER_ID).Loans().query().execute();
    expect(navigated.status).toBe(200);
    const loanId = navigated.data.value[0].Id;

    const patched = await LIBRARY.Loans(loanId).patch({ DueDate: "2026-07-01" }).execute();
    expect(patched.invalidates).toEqual(
      expect.arrayContaining([
        ["Loans", "detail", loanId],
        ["Loans", "list"],
        ["Members", "detail", MEMBER_ID, "Loans", "list"],
      ]),
    );
  });

  test("a statically-keyed hop's own segment is renamed to its entity set's name, deterministically invalidating the direct route - no prior read required. Not divergent in CAP's own model - Books really is the entity set here too - see int-test/asp-net for the case where the hop's own name and its entity set genuinely differ", async () => {
    const request = LIBRARY.Publishers(1).Books(BOOK_DER_PROZESS).query();
    expect(request.cacheKey).toEqual(["Publishers", "detail", 1, "Books", "detail", BOOK_DER_PROZESS]);
    expect(touchesResource(["Books", "detail", BOOK_DER_PROZESS], request.cacheKey!)).toBe(true);

    const result = await request.execute();
    expect(result.status).toBe(200);
    expect(result.data.Title).toBe("Der Prozess");

    // the deterministic proof: a write through the hop route invalidates the direct route's own key even
    // though nothing was ever read via that direct route first - no ResourceIdentityHandler involved
    const patched = await LIBRARY.Publishers(1).Books(BOOK_DER_PROZESS).patch({ Title: "Der Prozess" }).execute();
    expect(patched.invalidates).toEqual(
      expect.arrayContaining([
        ["Books", "detail", BOOK_DER_PROZESS],
        ["Books", "list"],
      ]),
    );
  });

  test("Chapters/up_ - a binding declared through the contained Chapters collection - names its hop by the navigation property", async () => {
    // `up_`'s NavigationPropertyBinding is `Chapters/up_`, reached only by first following the contained
    // `Chapters` collection to `AudiobookChapter` - a real gap in DataModel.getNavPropBindingTarget this
    // test pins against regressing, distinct from ASP.NET's cast-qualified case (CAP's model is flat, no
    // BaseType hierarchy at all - see Subtypes.test.ts in the asp-net suite).
    const request = LIBRARY.Audiobooks(AUDIOBOOK).Chapters(1).up_().query();
    expect(request.cacheKey).toEqual(["Audiobooks", "detail", AUDIOBOOK, "Chapters", "detail", 1, "up_", "detail"]);

    const result = await request.execute();
    expect(result.status).toBe(200);
    expect(result.data.Title).toBe("Der Prozess (Hoerbuch)");
  });

  test("$expand of up_ (reached only via the Chapters/up_ binding path) still enriches to a hop-shaped entry", async () => {
    // Mirrors int-test/asp-net's cast-qualified expand test, but for the through-a-hop binding shape: before
    // this fix, DataModel.getNavPropBindingTarget never resolved a target for `up_`, so `QAudiobookChapters_up_`
    // carried no QBinding and this expand entry fell back to the bare `"up_"` string instead.
    const request = LIBRARY.Audiobooks(AUDIOBOOK)
      .Chapters(1)
      .query((builder) => builder.expand("up_"));
    expect(request.cacheKey).toEqual([
      "Audiobooks",
      "detail",
      AUDIOBOOK,
      "Chapters",
      "detail",
      1,
      { expand: [["Audiobooks", "detail", "?"]], query: "%24expand=up_" },
    ]);
    expect(touchesResource(["Audiobooks", "detail"], request.cacheKey!)).toBe(true);
    expect(touchesResource(["Audiobooks", "detail", "?"], request.cacheKey!)).toBe(true);

    const result = await request.execute();
    expect(result.status).toBe(200);
  });

  test("touchesResource reaches a hierarchical key by its own name", () => {
    const key = LIBRARY.Members(MEMBER_ID).Loans().query().cacheKey!;
    expect(touchesResource(["Members", "detail", MEMBER_ID], key)).toBe(true);
    expect(touchesResource(["Loans", "list"], key)).toBe(true);
    expect(touchesResource(["Reservations", "list"], key)).toBe(false);
  });

  test("an unbound function roots at its own import name, never its declared result entity set's", async () => {
    const request = LIBRARY.Search({ Term: "Prozess" });
    expect(request.cacheKey).toEqual(["Search", "list", { params: { Term: "Prozess" } }]);

    const result = await request.execute();
    expect(result.status).toBe(200);
    expect(result.data.value.some((book) => book.Title === "Der Prozess")).toBe(true);
  });

  test("a groupBy ($apply) query produces a cache key distinct from the same query without it", () => {
    // the concrete regression this whole opaque-query-string redesign fixes: $apply used to be silently
    // excluded from the cache key, so an aggregated query collapsed onto its non-aggregated counterpart
    const plain = LIBRARY.Books().query((b) => b.top(5));
    const grouped = LIBRARY.Books().query((b) => {
      b.top(5);
      b.groupBy("Language");
    });
    expect(grouped.cacheKey).not.toEqual(plain.cacheKey);
  });

  test("invalidates on a PATCH, a POST and a DELETE", async () => {
    const created = await LIBRARY.Books().create({ Title: "CacheKeys Probe", Language: "de" }).execute();
    expect(created.status).toBe(201);
    expect(created.invalidates).toEqual([["Books", "list"]]);
    expectTypeOf(created).toEqualTypeOf<HttpResponseModel<ODataModelResponseV4<Books>>>();
    const bookId = created.data.Id;

    // CAP's V4 endpoint answers a patch with 200 and the full entity, unlike ASP.NET's 204
    const patched = await LIBRARY.Books(bookId).patch({ Language: "en" }).execute();
    expect(patched.status).toBe(200);
    expect(patched.invalidates).toEqual([
      ["Books", "detail", bookId],
      ["Books", "list"],
    ]);

    const deleted = await LIBRARY.Books(bookId).delete().execute();
    expect(deleted.status).toBe(204);
    expect(deleted.invalidates).toEqual([
      ["Books", "detail", bookId],
      ["Books", "list"],
    ]);

    // a read carries nothing extra
    const read = await LIBRARY.Books(BOOK_DER_PROZESS).query().execute();
    expect(read.invalidates).toBeUndefined();
  });
});
