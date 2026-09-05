import { HttpResponseModel } from "@odata2ts/http-client-api";
import { ODataModelResponseV4 } from "@odata2ts/odata-core";
import { touchesResource } from "@odata2ts/odata-service";
import { afterAll, describe, expect, expectTypeOf, test } from "vitest";
import { Medium } from "../../src-generated/library/library-catalog/index.js";
import { expectODataError } from "../expectODataError.js";
import { AUDIOBOOK, BOOK_DER_PROZESS, LIBRARY } from "../LibraryTestConstants.js";

/**
 * `cacheKeys: { mode: "on" }`, against the one server whose metadata reproduces the reference model
 * exactly - see the config's own comment for why. Every hop shape the generator can produce meets a real
 * request here: to-many and to-one navigation, containment and a stream.
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

  test("a root names itself by the entity set, never a type", async () => {
    const request = LIBRARY.Media().query();
    expect(request.cacheKey).toEqual(["Media", "list"]);

    const result = await request.execute();
    expect(result.status).toBe(200);
  });

  test("a to-one hop off a real entity: /Copies(...)/Medium names itself by the navigation property, with no key of its own - a to-one hop never knows the target's key up front", async () => {
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
    expect(request.cacheKey).toEqual(["Copies", "detail", copyKey, "Medium", "detail"]);

    const result = await request.execute();
    expect(result.status).toBe(200);
    expect(result.data.Title).toBe("Der Prozess");
    expectTypeOf(result).toEqualTypeOf<HttpResponseModel<ODataModelResponseV4<Medium>>>();

    // the hop still carries entitySetName/canonicalIdFn, so the response the server actually returned is
    // enough to recover the real canonical resource this hop reached, despite the key gap in the key itself
    const patched = await LIBRARY.Media(BOOK_DER_PROZESS)
      .asBookService()
      .patch({ Title: "Der Prozess" })
      .ignoreETag()
      .execute();
    expect(patched.invalidates).toEqual(expect.arrayContaining([["Copies", "detail", copyKey, "Medium", "detail"]]));
  });

  test("$expand produces a hop-shaped entry touchesResource can reach", async () => {
    const request = LIBRARY.Media(BOOK_DER_PROZESS).query((builder) => builder.expand("Copies"));
    expect(request.cacheKey).toEqual(["Media", "detail", BOOK_DER_PROZESS, { expand: [["Copies", "list"]] }]);
    expect(touchesResource(["Copies", "list"], request.cacheKey!)).toBe(true);

    const result = await request.execute();
    expect(result.status).toBe(200);
  });

  test("a to-many hop: /Media(...)/Copies names itself by the navigation property, distinct from a hand-filtered route to the same entity set", async () => {
    const viaNavigation = LIBRARY.Media(BOOK_DER_PROZESS).Copies().query();
    const viaFilter = LIBRARY.Copies().query((builder, qCopy) => builder.filter(qCopy.MediumId.eq(BOOK_DER_PROZESS)));

    expect(viaNavigation.cacheKey).toEqual(["Media", "detail", BOOK_DER_PROZESS, "Copies", "list"]);
    expect(viaFilter.cacheKey).toEqual(["Copies", "list", { filter: { MediumId: BOOK_DER_PROZESS } }]);
    // no more convergence by construction - the two keys are legitimately different arrays now; what makes
    // them invalidate together is the response-observed identity mechanism proven below, not equal keys

    const [navigated, filtered] = await Promise.all([viaNavigation.execute(), viaFilter.execute()]);
    expect(navigated.status).toBe(200);
    expect(filtered.status).toBe(200);
  });

  test("a read through a navigated route records the resource it served, so a later direct write to it also invalidates that route", async () => {
    const navigated = await LIBRARY.Media(BOOK_DER_PROZESS).Copies().query().execute();
    expect(navigated.status).toBe(200);
    expect(navigated.data.value.some((copy) => copy.InventoryNumber === CACHE_KEY_COPY)).toBe(true);

    const patched = await LIBRARY.Copies(copyKey).patch({ Condition: 4 }).ignoreETag().execute();
    expect(patched.status).toBe(204);
    expect(patched.invalidates).toEqual(
      expect.arrayContaining([
        ["Copies", "detail", copyKey],
        ["Copies", "list"],
        ["Media", "detail", BOOK_DER_PROZESS, "Copies", "list"],
      ]),
    );
  });

  test("grade B: /Members(...)/Loans names itself by the navigation property", async () => {
    const member = await LIBRARY.Members()
      .create({
        Name: "CacheKeys Test (grade B)",
        PreviousAddresses: [],
        Loans: [{ LoanedAt: "2026-05-01T10:00:00Z", DueDate: "2026-06-01" }],
      })
      .execute();
    expect(member.status).toBe(201);
    // the deep-inserted Loan contributes its own bare entity-set entry, additionally to the write's own -
    // this is what lets an application invalidate the Loan cache without knowing the new Loan's id
    expect(member.invalidates).toEqual([
      ["Members", "list"],
      ["Loans", "list"],
    ]);
    const memberId = member.data.Id;

    try {
      const request = LIBRARY.Members(memberId).Loans().query();
      expect(request.cacheKey).toEqual(["Members", "detail", memberId, "Loans", "list"]);

      const result = await request.execute();
      expect(result.status).toBe(200);
      expect(result.data.value.length).toBe(1);
    } finally {
      await LIBRARY.Members(memberId).delete().execute();
    }
  });

  test("grade C: /Members(...)/Reservations names itself the same way - no different treatment from grade B any more", async () => {
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
      expect(request.cacheKey).toEqual(["Members", "detail", memberId, "Reservations", "list"]);

      const result = await request.execute();
      expect(result.status).toBe(200);
      expect(result.data.value.length).toBe(1);
    } finally {
      await LIBRARY.Members(memberId).delete().execute();
    }
  });

  test("containment stays hierarchical, exactly like non-contained navigation: /Media(...)/Audiobook/Chapters", async () => {
    const request = LIBRARY.Media(AUDIOBOOK).asAudiobookService().Chapters().query();

    // no entitySetName: a contained entity has no entity set of its own - and the ancestor's own cast
    // (a params-object concern for that resource alone) does not carry into the hop either
    expect(request.cacheKey).toEqual(["Media", "detail", AUDIOBOOK, "Chapters", "list"]);

    const result = await request.execute();
    expect(result.status).toBe(200);
  });

  test("a stream: Audiobook/Sample carries a further $value hop", async () => {
    const stream = LIBRARY.Media(AUDIOBOOK).asAudiobookService().Sample();
    const request = stream.getBlob();

    expect(request.cacheKey).toEqual(["Media", "detail", AUDIOBOOK, "Sample", "$value"]);

    // the sample may or may not have content, but the request itself must be well-formed
    const result = await request.execute();
    expect([200, 204]).toContain(result.status);
  });

  test("an unbound function with no declared result entity set roots at its own import name", async () => {
    const request = LIBRARY.TotalMediaCount();
    expect(request.cacheKey).toEqual(["TotalMediaCount", "detail"]);

    const result = await request.execute();
    expect(result.status).toBe(200);
    expect(typeof result.data.value).toBe("number");
  });

  test("an unbound function with a declared result entity set roots at its own import name too, never the entity set's - invocation params nested under their own key", async () => {
    const request = LIBRARY.Search({ Term: "Prozess" });
    expect(request.cacheKey).toEqual(["Search", "list", { params: { Term: "Prozess" } }]);

    const result = await request.execute();
    expect(result.status).toBe(200);
    expect(result.data.value.some((medium) => medium.Title === "Der Prozess")).toBe(true);
  });

  test("touchesResource reaches a hierarchical key by its own name, but not an ancestor it never names as a top-level entry", () => {
    const hierarchicalKey = LIBRARY.Members(1).Reservations().query().cacheKey!;
    expect(touchesResource(["Members", "detail", 1], hierarchicalKey)).toBe(true);
    expect(touchesResource(["Reservations", "list"], hierarchicalKey)).toBe(true);
    expect(touchesResource(["Media", "list"], hierarchicalKey)).toBe(false);
  });

  test("invalidates on a PATCH, a POST and a DELETE - and none of the three has a cacheKey of its own", async () => {
    // created directly on the entity set (not navigated through Medium) - the server only accepts a POST
    // at an entity set's own URL, so this is also the shape with no ancestor: own key without params and
    // own entity set collapse onto the identical entry
    const createRequest = LIBRARY.Copies().create({
      MediumId: BOOK_DER_PROZESS,
      InventoryNumber: CACHE_KEY_COPY + 1,
      Condition: 4,
      IsLoanable: true,
      WeightKg: 0.6,
    });
    expect(createRequest.cacheKey).toBeUndefined();
    const created = await createRequest.execute();
    expect(created.status).toBe(201);
    expect(created.invalidates).toEqual([["Copies", "list"]]);

    const patchKey = { MediumId: BOOK_DER_PROZESS, InventoryNumber: CACHE_KEY_COPY + 1 };
    const patchRequest = LIBRARY.Copies(patchKey).patch({ Condition: 5 }).ignoreETag();
    expect(patchRequest.cacheKey).toBeUndefined();
    const patched = await patchRequest.execute();
    expect(patched.status).toBe(204);
    expect(patched.invalidates).toEqual([
      ["Copies", "detail", patchKey],
      ["Copies", "list"],
    ]);

    const deleteRequest = LIBRARY.Copies(patchKey).delete().ignoreETag();
    expect(deleteRequest.cacheKey).toBeUndefined();
    const deleted = await deleteRequest.execute();
    expect(deleted.status).toBe(204);
    expect(deleted.invalidates).toEqual([
      ["Copies", "detail", patchKey],
      ["Copies", "list"],
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
