import { describe, expect, test } from "vitest";
import { LIBRARY } from "../LibraryTestConstants.js";

/**
 * System query options on **write** requests: `create`, `update` and `patch`.
 *
 * odata2ts sends the options; whether a server honours them is a different question. Neither server does:
 * both answer a write with the *full* entity, `$select` or not. Pinned in both packages, because a caller
 * cannot see it from the request - only from what comes back.
 *
 * Note that `update` and `patch` return no body by default (204). A query option only becomes observable
 * with `Prefer: return=representation`, which odata2ts does **not** send on its own - the caller adds it,
 * and `<true>` tells the compiler to expect the body.
 */
describe("ASP.NET Library: query options on write requests", () => {
  const REPRESENTATION = { headers: { Prefer: "return=representation" } };

  async function givenMember() {
    const created = await LIBRARY.Members()
      .create({ Name: "CrudQuery Test", Balance: 5, PreviousAddresses: [] })
      .execute();
    return created.data.Id;
  }

  test("$select on create", async () => {
    const created = await LIBRARY.Members()
      .create({ Name: "CrudQuery Create", Balance: 1, PreviousAddresses: [] }, undefined, (builder) =>
        builder.select("Name"),
      )
      .execute();

    expect(created.status).toBe(201);
    expect(created.data.Name).toBe("CrudQuery Create");
    // not honoured: the option travels, and the server answers with the whole entity anyway
    expect(created.data.Balance).toBe(1);

    await LIBRARY.Members(created.data.Id).delete().execute();
  });

  test("$select on patch, with the representation asked for", async () => {
    const id = await givenMember();

    const patched = await LIBRARY.Members(id)
      .patch<true>({ Balance: 42 }, undefined, (builder) => builder.select("Balance"))
      .execute(REPRESENTATION);

    expect(patched.status).toBe(200);
    expect(patched.data.Balance).toBe(42);
    // again the full entity, so `$select` made no difference - only `Prefer` did
    expect(patched.data.Name).toBe("CrudQuery Test");

    await LIBRARY.Members(id).delete().execute();
  });

  test("$select on update", async () => {
    const id = await givenMember();

    const updated = await LIBRARY.Members(id)
      .update<true>({ Name: "CrudQuery Updated", Balance: 7, PreviousAddresses: [] }, undefined, (builder) =>
        builder.select("Name"),
      )
      .execute(REPRESENTATION);

    expect(updated.status).toBe(200);
    expect(updated.data.Name).toBe("CrudQuery Updated");
    expect(updated.data.Balance).toBe(7);

    await LIBRARY.Members(id).delete().execute();
  });

  test("without the Prefer header there is no body to apply a query option to", async () => {
    // The query option travels regardless, so this pins that the server does not suddenly answer with a
    // body just because one was requested - the default stays 204.
    const id = await givenMember();

    const patched = await LIBRARY.Members(id)
      .patch({ Balance: 9 }, undefined, (builder) => builder.select("Balance"))
      .execute();

    expect(patched.status).toBe(204);
    expect(patched.data).toBeUndefined();

    await LIBRARY.Members(id).delete().execute();
  });
});
