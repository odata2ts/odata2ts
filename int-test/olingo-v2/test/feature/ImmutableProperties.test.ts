import { describe, expect, expectTypeOf, test } from "vitest";
import type { EditableLoan, UpdatableLoan } from "../../src-generated/library-strict/index.js";
import { LIBRARY_STRICT } from "../LibraryTestConstants.js";

/**
 * `managedPropertyMode: "strictOmit"` against Olingo 2, the V2 counterpart of the same file in
 * `int-test/asp-net` and `int-test/cap`.
 *
 * Two things are only visible here. The first is where the managed state comes from: this server states
 * no vocabulary term at all - `Loan.LoanedAt` carries `sap:updatable="false"`, which the digester
 * normalizes to `Core.Immutable` before the option ever sees it. So this is the one package that shows
 * the V2 dialects actually reaching `strictOmit`.
 *
 * The second is what an update answers. V2 has no `Prefer: return=representation`, so PUT and MERGE both
 * come back 204 with no body: what the server kept is only observable on the read afterwards, which is
 * why every test here re-reads rather than inspecting the write's response.
 */
describe("Olingo V2 Library: immutable properties under strictOmit", () => {
  const LOANED_AT = "/Date(1777622400000)/";

  async function givenLoan(Id: string) {
    const created = await LIBRARY_STRICT.Loans()
      .create({ Id, LoanedAt: LOANED_AT, DueDate: "/Date(1780214400000)/" })
      .execute();
    expect(created.status).toBe(201);
  }

  test("the create model keeps the immutable properties, the update model drops them", () => {
    // `LoanedAt` comes from `sap:updatable="false"` and is `Nullable="false"`, so the service itself
    // says it is required on create; the key is non-nullable too but nothing describes it, and the
    // default `keyProperties` will not demand one the server may be generating
    expectTypeOf<EditableLoan["LoanedAt"]>().toEqualTypeOf<string>();
    expectTypeOf<EditableLoan["Id"]>().toEqualTypeOf<string | undefined>();

    expectTypeOf<UpdatableLoan>().not.toHaveProperty("Id");
    expectTypeOf<UpdatableLoan>().not.toHaveProperty("LoanedAt");
  });

  test("a client-assigned key really is taken by the server", async () => {
    const Id = "bbbbbbbb-0000-0000-0000-0000000009c1";
    await givenLoan(Id);

    try {
      const read = await LIBRARY_STRICT.Loans(Id).query().execute();
      expect(read.data.d.Id).toBe(Id);
      expect(read.data.d.LoanedAt).toBe(LOANED_AT);
    } finally {
      await LIBRARY_STRICT.Loans(Id).delete().execute();
    }
  });

  test("PUT without the immutable properties replaces the rest and keeps them", async () => {
    const Id = "bbbbbbbb-0000-0000-0000-0000000009c2";
    await givenLoan(Id);

    try {
      // `update` takes UpdatableLoan, so `LoanedAt` cannot be written here at all
      const updated = await LIBRARY_STRICT.Loans(Id).update({ DueDate: "/Date(1782892800000)/" }).execute();
      expect(updated.status).toBe(204);
      expectTypeOf(updated.data).toEqualTypeOf<undefined>();

      const read = await LIBRARY_STRICT.Loans(Id).query().execute();
      expect(read.data.d.DueDate).toBe("/Date(1782892800000)/");
      // a full replace which did not mention it, and it is still there
      expect(read.data.d.LoanedAt).toBe(LOANED_AT);
    } finally {
      await LIBRARY_STRICT.Loans(Id).delete().execute();
    }
  });

  test("MERGE without the immutable properties changes only what it names", async () => {
    const Id = "bbbbbbbb-0000-0000-0000-0000000009c3";
    await givenLoan(Id);

    try {
      // V2 has no PATCH: `patch()` sends MERGE, which is the same question put a different way
      const patched = await LIBRARY_STRICT.Loans(Id).patch({ ReturnedAt: "/Date(1779408000000)/" }).execute();
      expect(patched.status).toBe(204);

      const read = await LIBRARY_STRICT.Loans(Id).query().execute();
      expect(read.data.d.ReturnedAt).toBe("/Date(1779408000000)/");
      expect(read.data.d.LoanedAt).toBe(LOANED_AT);
    } finally {
      await LIBRARY_STRICT.Loans(Id).delete().execute();
    }
  });

  test("a changed immutable property sent anyway is silently dropped", async () => {
    const Id = "bbbbbbbb-0000-0000-0000-0000000009c4";
    await givenLoan(Id);

    try {
      /*
       * The strongest case in the set for the type doing the work. Olingo neither rejects the request the
       * way ASP.NET does nor applies it: it answers 204, exactly as a successful write does, and keeps the
       * old value. A caller has no way of telling that half of what they sent went nowhere - unless the
       * model never offered the property to begin with.
       */
      const payload = { DueDate: "/Date(1782892800000)/", LoanedAt: "/Date(1000000000000)/" } as UpdatableLoan;
      const updated = await LIBRARY_STRICT.Loans(Id).update(payload).execute();
      expect(updated.status).toBe(204);

      const read = await LIBRARY_STRICT.Loans(Id).query().execute();
      expect(read.data.d.DueDate).toBe("/Date(1782892800000)/");
      expect(read.data.d.LoanedAt).toBe(LOANED_AT);
    } finally {
      await LIBRARY_STRICT.Loans(Id).delete().execute();
    }
  });
});
