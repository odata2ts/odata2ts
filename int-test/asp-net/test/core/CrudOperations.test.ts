import { describe, expect, test } from "vitest";
import { BOOK_DER_PROZESS, LIBRARY, UNKNOWN_ID } from "../LibraryTestConstants.js";

describe("ASP.NET Library: CRUD", () => {
  test("read entity by key", async () => {
    const result = await LIBRARY.Media(BOOK_DER_PROZESS).query().execute();

    expect(result.status).toBe(200);
    expect(result.data.Title).toBe("Der Prozess");
    expect(result.data.Language).toBe("de");
  });

  test("read entity collection", async () => {
    const result = await LIBRARY.Media().query().execute();

    expect(result.status).toBe(200);
    expect(result.data.value.length).toBeGreaterThan(0);
  });

  test("read with unknown key yields 404", async () => {
    await expect(LIBRARY.Media(UNKNOWN_ID).query().execute()).rejects.toThrow();
  });

  test("create, read, patch and delete an entity", async () => {
    const created = await LIBRARY.Members()
      .create({ Name: "Integration Test", Balance: 0, PreviousAddresses: [] })
      .execute();
    expect(created.status).toBe(201);

    const id = created.data.Id;
    const member = LIBRARY.Members(id);

    const read = await member.query().execute();
    expect(read.data.Name).toBe("Integration Test");

    await member.patch({ Name: "Integration Test (patched)" }).execute();
    expect((await member.query().execute()).data.Name).toBe("Integration Test (patched)");

    const deleted = await member.delete().execute();
    expect(deleted.status).toBe(204);
    await expect(member.query().execute()).rejects.toThrow();
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
});
