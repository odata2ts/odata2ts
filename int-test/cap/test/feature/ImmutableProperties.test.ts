import { describe, expect, expectTypeOf, test } from "vitest";
import type { EditableLoans, UpdatableLoans } from "../../src-generated/library-strict/index.js";
import { BOOK_DER_PROZESS, LIBRARY_STRICT } from "../LibraryTestConstants.js";

/**
 * `managedPropertyMode: "strictOmit"` against CAP, the counterpart of the same file in `int-test/asp-net`
 * and `int-test/olingo-v2`.
 *
 * ASP.NET shows the mode where every managed property of the entity is immutable. This server shows the
 * more awkward case, and it is why the pair is worth running: `Loans` carries two *different* managed
 * states at once. `LoanedAt` is `Core.Immutable` - createOnly, and dropped from the update model. `Id` is
 * `Core.ComputedDefaultValue` - the client may supply it or leave it to the server, so it is neither
 * required on create nor dropped afterwards, even though it is also the key. A mode that reshaped write
 * models by "is it a key" rather than by managed state would get that one wrong.
 */
describe("CAP Library: immutable properties under strictOmit", () => {
  const COPY = { MediumId: BOOK_DER_PROZESS, InventoryNumber: 1001 };
  const LOANED_AT = "2026-05-01T10:00:00.000Z";

  async function givenLoan(Id: string, memberId: number) {
    // the key is required here, which is the mode's other half: `Members/Id` carries no annotation, so the
    // key rule makes it createOnly, and createOnly plus `Nullable="false"` means required on create
    const member = await LIBRARY_STRICT.Members().create({ Id: memberId, Name: "Immutable Test" }).execute();
    const created = await LIBRARY_STRICT.Loans()
      .create({
        Id,
        LoanedAt: LOANED_AT,
        DueDate: "2026-06-01",
        Member_Id: member.data.Id,
        Copy_MediumId: COPY.MediumId,
        Copy_InventoryNumber: COPY.InventoryNumber,
      })
      .execute();
    expect(created.status).toBe(201);
    return { memberId: member.data.Id };
  }

  async function cleanUp(loanId: string, memberId: number) {
    await LIBRARY_STRICT.Loans(loanId).delete().execute();
    await LIBRARY_STRICT.Members(memberId).delete().execute();
  }

  test("only the createOnly property follows nullable and is dropped afterwards", () => {
    // `Core.Immutable` and `Nullable="false"`, so required on create ...
    expectTypeOf<EditableLoans["LoanedAt"]>().toEqualTypeOf<string>();
    // ... and gone from the update model, not merely optional there
    expectTypeOf<UpdatableLoans>().not.toHaveProperty("LoanedAt");
  });

  test("a computed-default key is left alone by the mode", () => {
    /*
     * `Core.ComputedDefaultValue` beats the key rule, so `Id` is optionalWithDefault rather than
     * createOnly - optional on create, and still present afterwards. strictOmit only ever drops what is
     * createOnly, which is the distinction this pins.
     */
    expectTypeOf<EditableLoans["Id"]>().toEqualTypeOf<string | undefined>();
    expectTypeOf<UpdatableLoans["Id"]>().toEqualTypeOf<string | undefined>();
  });

  test("a client-assigned key really is taken by the server", async () => {
    const Id = "bbbbbbbb-0000-0000-0000-0000000009a1";
    const { memberId } = await givenLoan(Id, 9901);

    try {
      const read = await LIBRARY_STRICT.Loans(Id).query().execute();
      expect(read.data.Id).toBe(Id);
      expect(read.data.LoanedAt).toBe(LOANED_AT);
    } finally {
      await cleanUp(Id, memberId);
    }
  });

  test("PUT without the immutable property replaces the rest and keeps it", async () => {
    const Id = "bbbbbbbb-0000-0000-0000-0000000009a2";
    const { memberId } = await givenLoan(Id, 9902);

    try {
      // `update` takes UpdatableLoans, so `LoanedAt` cannot be written here at all - and a PUT being a
      // full replace, this pins that the server leaves the immutable property standing regardless
      const updated = await LIBRARY_STRICT.Loans(Id)
        .update<true>({
          DueDate: "2026-07-15",
          Member_Id: memberId,
          Copy_MediumId: COPY.MediumId,
          Copy_InventoryNumber: COPY.InventoryNumber,
        })
        .execute({ headers: { Prefer: "return=representation" } });

      expect(updated.status).toBe(200);
      expect(updated.data.DueDate).toBe("2026-07-15");
      expect(updated.data.LoanedAt).toBe(LOANED_AT);
    } finally {
      await cleanUp(Id, memberId);
    }
  });

  test("PATCH without the immutable property changes only what it names", async () => {
    const Id = "bbbbbbbb-0000-0000-0000-0000000009a3";
    const { memberId } = await givenLoan(Id, 9903);

    try {
      const patched = await LIBRARY_STRICT.Loans(Id)
        .patch<true>({ ReturnedAt: "2026-05-20T14:00:00.000Z" })
        .execute({ headers: { Prefer: "return=representation" } });

      expect(patched.status).toBe(200);
      expect(patched.data.ReturnedAt).toBe("2026-05-20T14:00:00.000Z");
      expect(patched.data.LoanedAt).toBe(LOANED_AT);
    } finally {
      await cleanUp(Id, memberId);
    }
  });

  test("a changed immutable property sent anyway is not honoured", async () => {
    const Id = "bbbbbbbb-0000-0000-0000-0000000009a4";
    const { memberId } = await givenLoan(Id, 9904);

    try {
      /*
       * Why the type is worth having: unlike ASP.NET, which answers 400, CAP takes the request and simply
       * declines to apply the value. Nothing tells the caller their write did not happen - the model
       * refusing to offer the property is the only warning there is.
       */
      const payload = { LoanedAt: "2020-01-01T00:00:00.000Z" } as unknown as UpdatableLoans;
      const patched = await LIBRARY_STRICT.Loans(Id).patch(payload).execute();
      // 200 rather than 204: CAP answers a PATCH with the entity even unasked, which makes the point
      // sharper still - the response looks like a successful write of what was sent
      expect(patched.status).toBe(200);

      const read = await LIBRARY_STRICT.Loans(Id).query().execute();
      expect(read.data.LoanedAt).toBe(LOANED_AT);
    } finally {
      await cleanUp(Id, memberId);
    }
  });
});
