import { HttpResponseModel } from "@odata2ts/http-client-api";
import { ODataModelResponseV4 } from "@odata2ts/odata-core";
import { touchesResource } from "@odata2ts/odata-service";
import { afterAll, describe, expect, expectTypeOf, test } from "vitest";
import { Medium } from "../../src-generated/library/library-catalog/index.js";
import { expectODataError } from "../expectODataError.js";
import { AUDIOBOOK, BOOK_DER_PROZESS, LIBRARY } from "../LibraryTestConstants.js";

/**
 * `cacheKeys: { mode: "typeFlattening" }`, against the one server whose metadata reproduces the reference
 * model exactly - see the config's own comment for why. Every documented hop outcome meets a real request
 * here: grade A to-many and to-one (`Copy`/`Medium`), grade B (`Member`/`Loans`), grade C
 * (`Member`/`Reservations`), containment (`Audiobook`/`Chapters`) and a stream (`Audiobook`/`Sample`).
 *
 * Every key assertion is paired with an executed request whose response is asserted too - the point of a
 * server int-test is that the key describes the resource the server actually served, not a fixture's idea
 * of one.
 */
describe("ASP.NET Library: cache keys", () => {
  /** A copy only this file touches, so a re-run against the same server does not collide. */
  const CACHE_KEY_COPY = 8801;
  const copyKey = { MediumId: BOOK_DER_PROZESS, InventoryNumber: CACHE_KEY_COPY };

  afterAll(async () => {
    await LIBRARY.Copies(copyKey).delete().ignoreETag().execute();
  });

  test("entityTypeName is the entity set's FQ type", () => {
    expect(LIBRARY.Media().entityTypeName).toBe("Library.Catalog.Medium");
    expect(LIBRARY.Copies().entityTypeName).toBe("Library.Circulation.Copy");
    expect(LIBRARY.Members().entityTypeName).toBe("Library.Circulation.Member");
  });

  test("the convergence claim: a navigated and a hand-filtered route produce the identical key", async () => {
    const viaNavigation = LIBRARY.Media(BOOK_DER_PROZESS).Copies().query();
    const viaFilter = LIBRARY.Copies().query((builder, qCopy) => builder.filter(qCopy.MediumId.eq(BOOK_DER_PROZESS)));

    expect(viaNavigation.cacheKey).toEqual(viaFilter.cacheKey);
    expect(viaNavigation.cacheKey).toEqual([
      "Library.Circulation.Copy",
      "list",
      { filter: { MediumId: BOOK_DER_PROZESS } },
    ]);

    // both are real, executable requests - the convergence claim is about the key, not about two dead ends
    const [navigated, filtered] = await Promise.all([viaNavigation.execute(), viaFilter.execute()]);
    expect(navigated.status).toBe(200);
    expect(filtered.status).toBe(200);
  });

  test("grade A to-one: /Copies(...)/Medium re-roots to a true canonical entity key", async () => {
    const created = await LIBRARY.Copies()
      .create({
        MediumId: BOOK_DER_PROZESS,
        InventoryNumber: CACHE_KEY_COPY,
        Condition: 3,
        IsLoanable: true,
        WeightKg: 0.5,
      })
      .execute();
    expect(created.status).toBe(201);

    const request = LIBRARY.Copies(copyKey).Medium().query();
    expect(request.cacheKey).toEqual(["Library.Catalog.Medium", "detail", BOOK_DER_PROZESS]);

    const result = await request.execute();
    expect(result.status).toBe(200);
    expect(result.data.Title).toBe("Der Prozess");
    expectTypeOf(result).toEqualTypeOf<HttpResponseModel<ODataModelResponseV4<Medium>>>();
  });

  test("grade B: /Members(...)/Loans re-roots through the navigation path", async () => {
    const member = await LIBRARY.Members()
      .create({
        Name: "CacheKeys Test (grade B)",
        PreviousAddresses: [],
        Loans: [{ LoanedAt: "2026-05-01T10:00:00Z", DueDate: "2026-06-01" }],
      })
      .execute();
    expect(member.status).toBe(201);
    const memberId = member.data.Id;

    try {
      const request = LIBRARY.Members(memberId).Loans().query();
      expect(request.cacheKey).toEqual(["Library.Circulation.Loan", "list", { filter: { "Member/Id": memberId } }]);

      const result = await request.execute();
      expect(result.status).toBe(200);
      expect(result.data.value.length).toBe(1);
    } finally {
      await LIBRARY.Members(memberId).delete().execute();
    }
  });

  test("grade C stays hierarchical, even inside a typeFlattening client: /Members(...)/Reservations", async () => {
    const member = await LIBRARY.Members()
      .create({
        Name: "CacheKeys Test (grade C)",
        PreviousAddresses: [],
        Reservations: [{ ReservedAt: "2026-05-01T10:00:00Z" }],
      })
      .execute();
    expect(member.status).toBe(201);
    const memberId = member.data.Id;

    try {
      const request = LIBRARY.Members(memberId).Reservations().query();
      expect(request.cacheKey).toEqual([
        "Library.Circulation.Member",
        "detail",
        memberId,
        "Library.Circulation.Reservation",
        "list",
        "Reservations",
      ]);

      const result = await request.execute();
      expect(result.status).toBe(200);
      expect(result.data.value.length).toBe(1);
    } finally {
      await LIBRARY.Members(memberId).delete().execute();
    }
  });

  test("containment stays hierarchical: /Media(...)/Audiobook/Chapters", async () => {
    const request = LIBRARY.Media(AUDIOBOOK).asAudiobookService().Chapters().query();

    // no entitySetType: a contained entity has no entity set of its own
    expect(request.cacheKey).toEqual([
      "Library.Catalog.Medium",
      "detail",
      AUDIOBOOK,
      "Library.Catalog.AudiobookChapter",
      "list",
      "Chapters",
    ]);

    const result = await request.execute();
    expect(result.status).toBe(200);
  });

  test("a stream: Audiobook/Sample carries a further $value hop", async () => {
    const stream = LIBRARY.Media(AUDIOBOOK).asAudiobookService().Sample();
    const request = stream.getBlob();

    expect(request.cacheKey).toEqual(["Library.Catalog.Medium", "detail", AUDIOBOOK, "Sample", "$value"]);

    // the sample may or may not have content, but the request itself must be well-formed
    const result = await request.execute();
    expect([200, 204]).toContain(result.status);
  });

  test("touchesResource reaches a hierarchical key by type, but not a re-rooted one's ancestor", () => {
    const hierarchicalKey = LIBRARY.Members(1).Reservations().query().cacheKey!;
    expect(touchesResource("Library.Circulation.Member", hierarchicalKey)).toBe(true);
    expect(touchesResource("Library.Circulation.Reservation", hierarchicalKey)).toBe(true);
    expect(touchesResource("Library.Catalog.Medium", hierarchicalKey)).toBe(false);

    const reRootedKey = LIBRARY.Media(BOOK_DER_PROZESS).Copies().query().cacheKey!;
    expect(touchesResource("Library.Circulation.Copy", reRootedKey)).toBe(true);
    // the ancestor is not part of the key array itself under typeFlattening - only `invalidates` carries it
    expect(touchesResource("Library.Catalog.Medium", reRootedKey)).toBe(false);
  });

  test("invalidates on a PATCH, a POST and a DELETE", async () => {
    // created directly on the entity set (not navigated through Medium) - the server only accepts a POST
    // at an entity set's own URL, so this is also the shape with no ancestor: own key without params and
    // own type collapse onto the identical entry, and rule 3 contributes nothing without a navigation
    const created = await LIBRARY.Copies()
      .create({
        MediumId: BOOK_DER_PROZESS,
        InventoryNumber: CACHE_KEY_COPY + 1,
        Condition: 4,
        IsLoanable: true,
        WeightKg: 0.6,
      })
      .execute();
    expect(created.status).toBe(201);
    expect(created.invalidates).toEqual([["Library.Circulation.Copy", "list"]]);

    const patchKey = { MediumId: BOOK_DER_PROZESS, InventoryNumber: CACHE_KEY_COPY + 1 };
    const patched = await LIBRARY.Copies(patchKey).patch({ Condition: 5 }).ignoreETag().execute();
    expect(patched.status).toBe(204);
    expect(patched.invalidates).toEqual([
      ["Library.Circulation.Copy", "detail", patchKey],
      ["Library.Circulation.Copy", "list"],
    ]);

    const deleted = await LIBRARY.Copies(patchKey).delete().ignoreETag().execute();
    expect(deleted.status).toBe(204);
    expect(deleted.invalidates).toEqual([
      ["Library.Circulation.Copy", "detail", patchKey],
      ["Library.Circulation.Copy", "list"],
    ]);

    // a read carries nothing extra - the key it should be stored under is `cacheKey`, not `invalidates`
    const read = await LIBRARY.Media(BOOK_DER_PROZESS).query().execute();
    expect(read.invalidates).toBeUndefined();
  });

  test("reading an unknown copy still answers a well-formed 404", async () => {
    await expectODataError(LIBRARY.Copies({ MediumId: BOOK_DER_PROZESS, InventoryNumber: 999999 }).query().execute(), {
      status: 404,
      message: /No error message/,
    });
  });
});
