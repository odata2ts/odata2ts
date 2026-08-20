import { describe, expect, expectTypeOf, test } from "vitest";
import type {
  EditableBranch,
  EditableLoan,
  EditableMember,
  UpdatableBranch,
  UpdatableLoan,
} from "../../src-generated/library-strict/library-circulation/index.js";
import { LIBRARY_STRICT } from "../LibraryTestConstants.js";

/**
 * `managedPropertyMode: "strictOmit"` with `keyProperties: "strict"` against ASP.NET, the counterpart of
 * the same file in `int-test/cap` and `int-test/olingo-v2`.
 *
 * Since 0.2.0 the server declares who owns every key: nine carry `Core.Computed` and `Branch/Id` carries
 * nothing, because a branch code is the organisation's to allocate. That is what makes `strict` usable
 * here at all - it demands a non-nullable key on create, which is only right once a bare key genuinely
 * means "yours to supply". Before, it would have demanded nine keys no client can know.
 *
 * So both halves of the story sit side by side in one client: a **generated** key is absent from both
 * write models and discarded if sent anyway, while the **client-assigned** one is required on create and
 * absent from the update model, since it cannot change once the entity exists.
 */
describe("ASP.NET Library: managed keys and immutable properties", () => {
  const LOANED_AT = "2026-05-01T10:00:00Z";

  /**
   * A loan comes into existence through its member: this server answers a POST to `/Loans` with 405. Its
   * key is generated now, so nothing here supplies one and the loan is read back to find it.
   */
  async function givenLoan() {
    const member = await LIBRARY_STRICT.Members()
      .create({
        Name: "Immutable Test",
        PreviousAddresses: [],
        Loans: [{ LoanedAt: LOANED_AT, DueDate: "2026-06-01" }],
      })
      .execute();
    expect(member.status).toBe(201);

    const loans = await LIBRARY_STRICT.Members(member.data.Id)
      .query((builder) => builder.expanding("Loans", (loan) => loan))
      .execute();
    return { memberId: member.data.Id, loanId: loans.data.Loans![0].Id };
  }

  /** Deleting the member takes its loans with it - `Member.Loans` cascades, and `/Loans(…)` has no DELETE. */
  async function cleanUp(memberId: number) {
    await LIBRARY_STRICT.Members(memberId).delete().execute();
  }

  test("a generated key is in no write model at all", () => {
    // `Core.Computed` makes it readOnly, and strictOmit takes a readOnly property out of both - there is
    // no operation in which a value the client sends would count for anything
    expectTypeOf<EditableLoan>().not.toHaveProperty("Id");
    expectTypeOf<UpdatableLoan>().not.toHaveProperty("Id");
    expectTypeOf<EditableMember>().not.toHaveProperty("Id");
  });

  test("the client-assigned key is required on create and gone from the update model", () => {
    // `Branch/Id` carries no annotation, which after 0.2.0 is a statement rather than a silence: every
    // key the server generates says so, so what stays bare is the client's. `strict` therefore requires
    // it - the property is non-nullable, and nothing else will supply it.
    expectTypeOf<EditableBranch["Id"]>().toEqualTypeOf<number>();

    // and it cannot change afterwards, so the update model has no place for it
    expectTypeOf<UpdatableBranch>().not.toHaveProperty("Id");
    expectTypeOf<UpdatableBranch["Name"]>().toEqualTypeOf<string>();
  });

  test("an annotated immutable property follows nullable on create", () => {
    // `Loan.LoanedAt` carries `Core.Immutable` and is non-nullable, so the service itself says it is
    // required on create - and `strictOmit` drops it from the update model
    expectTypeOf<EditableLoan["LoanedAt"]>().toEqualTypeOf<string>();
    expectTypeOf<UpdatableLoan>().not.toHaveProperty("LoanedAt");
  });

  test("the client-assigned key really is stored as sent", async () => {
    const Id = 4201;
    const created = await LIBRARY_STRICT.Branches()
      .create({ Id, Name: "Client Assigned Branch", LowestFloor: 0, Population: 1000 })
      .execute();

    try {
      // the point of leaving the key bare: requiring it in the create payload is only right if the
      // server actually stores what was sent, rather than generating over it
      expect(created.status).toBe(201);
      expect(created.data.Id).toBe(Id);
      expect((await LIBRARY_STRICT.Branches(Id).query().execute()).data.Name).toBe("Client Assigned Branch");
    } finally {
      await LIBRARY_STRICT.Branches(Id).delete().execute();
    }
  });

  test("PATCH without the immutable properties changes only what it names", async () => {
    const { memberId, loanId } = await givenLoan();

    try {
      const patched = await LIBRARY_STRICT.Loans(loanId)
        .patch<true>({ ReturnedAt: "2026-05-20T14:00:00Z" })
        .execute({ headers: { Prefer: "return=representation" } });

      expect(patched.status).toBe(200);
      expect(patched.data.ReturnedAt).toContain("2026-05-20T14:00:00");
      expect(patched.data.LoanedAt).toContain("2026-05-01T10:00:00");
    } finally {
      await cleanUp(memberId);
    }
  });

  test("a changed immutable property sent anyway is disregarded", async () => {
    const { memberId, loanId } = await givenLoan();

    try {
      /*
       * Casting past `UpdatableLoan` is the only way to ask this, and 0.2.0 is the release where the
       * answer became the right one: the server ignores the value, as Protocol 11.4.3 requires of a
       * property it declares managed. It used to apply it.
       *
       * The response says nothing either way - 204, exactly as a request that changed everything it
       * asked for. Which is the whole argument for keeping the property out of the payload: a caller
       * reading only the response cannot tell a discarded value from an applied one.
       */
      const payload = { LoanedAt: "2020-01-01T00:00:00Z" } as unknown as UpdatableLoan;
      const patched = await LIBRARY_STRICT.Loans(loanId).patch(payload).execute();
      expect(patched.status).toBe(204);

      const read = await LIBRARY_STRICT.Loans(loanId).query().execute();
      expect(read.data.LoanedAt).toContain("2026-05-01T10:00:00");
    } finally {
      await cleanUp(memberId);
    }
  });

  test("a generated key sent anyway is disregarded too", async () => {
    /*
     * The same rule reaching the other kind of managed property. `Medium.Id` is `Core.Computed` since
     * 0.2.0, so the Guid below goes nowhere and the server assigns its own - which is what the type was
     * saying by not offering the property at all.
     */
    const wanted = "12121212-1212-1212-1212-121212121212";
    const payload = { Title: "Key Probe", PageCount: 1, AgeRating: 0, Id: wanted } as never;
    const created = await LIBRARY_STRICT.Media().asBookCollectionService().create(payload).execute();

    try {
      expect(created.status).toBe(201);
      expect(created.data.Id).not.toBe(wanted);
    } finally {
      await LIBRARY_STRICT.Media(created.data.Id).delete().execute();
    }
  });
});
