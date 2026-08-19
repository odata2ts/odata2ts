import { describe, expect, expectTypeOf, test } from "vitest";
import type {
  EditableLoan,
  EditableMember,
  UpdatableLoan,
  UpdatableMember,
} from "../../src-generated/library-strict/library-circulation/index.js";
import { LIBRARY_STRICT } from "../LibraryTestConstants.js";

/**
 * `managedPropertyMode: "strictOmit"` against ASP.NET, the counterpart of the same file in `int-test/cap`
 * and `int-test/olingo-v2`.
 *
 * The mode makes two claims about a `createOnly` property - `Loan.LoanedAt`, which carries
 * `Core.Immutable`, and every key without an annotation of its own, which the key rule makes createOnly:
 *
 * 1. it belongs in a create payload, required or optional per `nullable`, and
 * 2. it belongs in no update payload at all.
 *
 * Only the first is a type-level statement. The second is a claim about the *server*, and the pinned
 * version does not yet keep it: it applies a `LoanedAt` sent on a PATCH. That is a gap in our own server
 * rather than a trait of ASP.NET Core OData - the spec is unambiguous that such a value MUST be ignored -
 * and it is fixed in test-server-asp-net#16. The last test pins what the pinned image really does, so
 * raising the version makes it fail and the expectation gets corrected as a reviewed step.
 *
 * The split between which entity carries which test is the server's doing: `LoansController` implements
 * GET and PATCH only (deliberately - see its own source), so PUT is asked of `Members`, whose key is
 * createOnly by the key rule rather than by annotation.
 */
describe("ASP.NET Library: immutable properties under strictOmit", () => {
  const LOANED_AT = "2026-05-01T10:00:00Z";

  /**
   * A loan comes into existence through its member: this server answers a POST to `/Loans` with 405, so a
   * deep insert is the only way to create one. Which suits the question here - the point is what the loan
   * looks like *afterwards*, and its key is the client's to choose either way.
   */
  async function givenLoan(Id: string, memberId: number) {
    const member = await LIBRARY_STRICT.Members()
      .create({
        Id: memberId,
        Name: "Immutable Test",
        PreviousAddresses: [],
        Loans: [{ Id, LoanedAt: LOANED_AT, DueDate: "2026-06-01" }],
      })
      .execute();
    expect(member.status).toBe(201);
    return { memberId: member.data.Id };
  }

  /** Deleting the member takes its loans with it - `Member.Loans` cascades, and `/Loans(…)` has no DELETE. */
  async function cleanUp(memberId: number) {
    await LIBRARY_STRICT.Members(memberId).delete().execute();
  }

  test("the create model keeps immutable properties, and the annotated one follows nullable", () => {
    // `LoanedAt` carries `Core.Immutable` and is `Nullable="false"`, so the service itself says it is
    // required on create
    expectTypeOf<EditableLoan["LoanedAt"]>().toEqualTypeOf<string>();

    // the keys are non-nullable too, but nothing describes them - and this package generates under the
    // default `keyProperties`, which will not demand a key the server may well be generating
    expectTypeOf<EditableLoan["Id"]>().toEqualTypeOf<string | undefined>();
    expectTypeOf<EditableMember["Id"]>().toEqualTypeOf<number | undefined>();
  });

  test("the update model drops them entirely", () => {
    // absent, not optional: there is no value the caller could put here that the server would honour
    expectTypeOf<UpdatableLoan>().not.toHaveProperty("Id");
    expectTypeOf<UpdatableLoan>().not.toHaveProperty("LoanedAt");
    expectTypeOf<UpdatableMember>().not.toHaveProperty("Id");
    // everything else stays exactly as it is in the create model
    expectTypeOf<UpdatableLoan["DueDate"]>().toEqualTypeOf<string>();
    expectTypeOf<UpdatableLoan["LateFee"]>().toEqualTypeOf<number | null | undefined>();
  });

  test("a client-assigned key really is taken by the server", async () => {
    const Id = "55555555-5555-5555-5555-555555555501";
    const { memberId } = await givenLoan(Id, 9901);

    try {
      // the point of createOnly rather than readOnly: the key was the client's to choose, and requiring it
      // in the create payload is only right if the server actually stores what was sent
      const read = await LIBRARY_STRICT.Loans(Id).query().execute();
      expect(read.data.Id).toBe(Id);
      expect(read.data.LoanedAt).toContain("2026-05-01T10:00:00");
    } finally {
      await cleanUp(memberId);
    }
  });

  test("PATCH without the immutable properties changes only what it names", async () => {
    const Id = "55555555-5555-5555-5555-555555555503";
    const { memberId } = await givenLoan(Id, 9903);

    try {
      const patched = await LIBRARY_STRICT.Loans(Id)
        .patch<true>({ ReturnedAt: "2026-05-20T14:00:00Z" })
        .execute({ headers: { Prefer: "return=representation" } });

      expect(patched.status).toBe(200);
      expect(patched.data.ReturnedAt).toContain("2026-05-20T14:00:00");
      expect(patched.data.LoanedAt).toContain("2026-05-01T10:00:00");
    } finally {
      await cleanUp(memberId);
    }
  });

  test("PUT without the key replaces the rest and keeps it", async () => {
    const memberId = 9905;
    const member = await LIBRARY_STRICT.Members()
      .create({ Id: memberId, Name: "Put Target", PreviousAddresses: [] })
      .execute();

    try {
      // `update` takes UpdatableMember, so the key cannot be written here at all. A PUT is a full replace,
      // and this pins that the entity keeps the identity it was created with regardless.
      const updated = await LIBRARY_STRICT.Members(member.data.Id)
        .update({ Name: "Replaced", PreviousAddresses: [] })
        .execute();
      expect(updated.status).toBe(204);

      const read = await LIBRARY_STRICT.Members(member.data.Id).query().execute();
      expect(read.data.Name).toBe("Replaced");
      expect(read.data.Id).toBe(member.data.Id);
    } finally {
      await cleanUp(member.data.Id);
    }
  });

  test("the pinned server still applies a changed immutable property", async () => {
    const Id = "55555555-5555-5555-5555-555555555504";
    const { memberId } = await givenLoan(Id, 9904);

    try {
      /*
       * Casting past `UpdatableLoan` is the only way to ask this question, and the answer is why the type
       * is worth generating at all. Protocol 11.4.3 leaves no room - "the service MUST ignore that value
       * when applying the update" - and the pinned image does not: it stores 2020 and answers 204, so a
       * caller reading the response cannot tell that a value was overwritten.
       *
       * Recorded rather than worked around: the fix is test-server-asp-net#16, and when the image pin
       * moves to a release carrying it this expectation inverts to the value staying put. Its counterpart
       * in `int-test/cap` already shows the correct behaviour, which is what makes this one a defect and
       * not a difference.
       */
      const payload = { LoanedAt: "2020-01-01T00:00:00Z" } as unknown as UpdatableLoan;
      const patched = await LIBRARY_STRICT.Loans(Id).patch(payload).execute();
      expect(patched.status).toBe(204);

      const read = await LIBRARY_STRICT.Loans(Id).query().execute();
      expect(read.data.LoanedAt).toContain("2020-01-01T00:00:00");
    } finally {
      await cleanUp(memberId);
    }
  });
});
