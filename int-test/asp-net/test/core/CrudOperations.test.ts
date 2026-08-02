import { HttpResponseModel } from "@odata2ts/http-client-api";
import { ODataCollectionResponseV4, ODataModelResponseV4 } from "@odata2ts/odata-core";
import { describe, expect, expectTypeOf, test } from "vitest";
import { Medium, Member } from "../../src-generated/library/LibraryModel.js";
import { expectODataError } from "../expectODataError.js";
import { BOOK_DER_PROZESS, LIBRARY, UNKNOWN_ID } from "../LibraryTestConstants.js";

describe("ASP.NET Library: CRUD", () => {
  test("read entity by key", async () => {
    const result = await LIBRARY.Media(BOOK_DER_PROZESS).query().execute();

    expect(result.status).toBe(200);
    expect(result.data.Title).toBe("Der Prozess");
    expect(result.data.Language).toBe("de");

    // The response structure is generated, so it is worth pinning: a single entity arrives unwrapped,
    // and the nullability of the model comes from the metadata.
    expectTypeOf(result).toEqualTypeOf<HttpResponseModel<ODataModelResponseV4<Medium>>>();
  });

  test("read entity collection", async () => {
    const result = await LIBRARY.Media().query().execute();

    expect(result.status).toBe(200);
    expect(result.data.value.length).toBeGreaterThan(0);

    // A collection is wrapped in `value` - that is the difference to the single entity above
    expectTypeOf(result).toEqualTypeOf<HttpResponseModel<ODataCollectionResponseV4<Medium>>>();
  });

  test("read with unknown key yields 404", async () => {
    // This server answers 404 with an empty body, so the message a user ends up seeing is the client's
    // own fallback. Pinned as it is: it is what reaches them, and it differs from CAP, which sends one.
    await expectODataError(LIBRARY.Media(UNKNOWN_ID).query().execute(), {
      status: 404,
      message: /No error message/,
    });
  });

  test("create, read, patch and delete an entity", async () => {
    const created = await LIBRARY.Members()
      .create({ Name: "Integration Test", Balance: 0, PreviousAddresses: [] })
      .execute();
    expect(created.status).toBe(201);
    expectTypeOf(created).toEqualTypeOf<HttpResponseModel<ODataModelResponseV4<Member>>>();

    const id = created.data.Id;
    const member = LIBRARY.Members(id);

    const read = await member.query().execute();
    expect(read.data.Name).toBe("Integration Test");

    const patched = await member.patch({ Name: "Integration Test (patched)" }).execute();
    expect(patched.status).toBe(204);
    // no body by default, and the typing says so
    expectTypeOf(patched).toEqualTypeOf<HttpResponseModel<undefined>>();
    expect((await member.query().execute()).data.Name).toBe("Integration Test (patched)");

    const deleted = await member.delete().execute();
    expect(deleted.status).toBe(204);
    expectTypeOf(deleted).toEqualTypeOf<HttpResponseModel<undefined>>();

    await expectODataError(member.query().execute(), { status: 404, message: /No error message/ });
  });

  test("patch answers with the entity when asked to", async () => {
    const created = await LIBRARY.Members()
      .create({ Name: "Prefer Test", Balance: 0, PreviousAddresses: [] })
      .execute();
    const member = LIBRARY.Members(created.data.Id);

    // Two separate things, and mixing them up is easy: `Prefer: return=representation` is what makes the
    // server send a body, while `<true>` only tells the compiler to expect one. odata2ts never adds the
    // header on its own, so the caller has to - which is exactly what this pins down.
    const patched = await member
      .patch<true>({ Balance: 12.5 })
      .execute({ headers: { Prefer: "return=representation" } });

    expect(patched.status).toBe(200);
    expect(patched.data.Balance).toBe(12.5);
    expectTypeOf(patched).toEqualTypeOf<HttpResponseModel<ODataModelResponseV4<Member>>>();

    // ... and without the header the very same call answers 204, hence the default typing
    const withoutHeader = await member.patch({ Balance: 13.5 }).execute();
    expect(withoutHeader.status).toBe(204);

    await member.delete().execute();
  });

  test("deep insert creates the nested entity as well", async () => {
    // The nested entity has to become addressable in its own set, not just through the parent - the
    // server had that wrong at first, answering 201 while leaving the child keyless and invisible.
    const before = await LIBRARY.Loans()
      .query((b) => b.count().top(0))
      .execute();

    const created = await LIBRARY.Members()
      .create({
        Name: "Deep Insert",
        Balance: 0,
        PreviousAddresses: [],
        Loans: [{ LoanedAt: "2026-08-01T10:00:00Z", DueDate: "2026-09-01" }],
      } as never)
      .execute();

    expect(created.status).toBe(201);

    const after = await LIBRARY.Loans()
      .query((b) => b.count().top(0))
      .execute();
    expect(Number(after.data["@odata.count"])).toBe(Number(before.data["@odata.count"]) + 1);
  });

  test("deleting an unknown entity yields 404", async () => {
    await expectODataError(LIBRARY.Media(UNKNOWN_ID).delete().execute(), {
      status: 404,
      message: /No error message/,
    });
  });
});
