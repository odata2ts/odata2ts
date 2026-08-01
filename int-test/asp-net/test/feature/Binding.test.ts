import { describe, expect, test } from "vitest";
import { BASE_URL, BOOK_DER_PROZESS, BRANCH_CENTRAL, BRANCH_SUBURBAN, LIBRARY } from "../LibraryTestConstants.js";

/**
 * The binding notations of odata2ts issue #38, end to end against a real server.
 *
 * This is the first server we have that honours them, which is why they get their own file: until now
 * the feature was only ever proven at generator level, against fixtures. A fixture cannot show that the
 * link actually moved on the other side.
 *
 * The client is generated for OData 4.0, so the generated property is `Nav@odata.bind` carrying a URL.
 * The 4.01 spelling - a nested `{"@id": …}` - is sent by hand in the last test, since a 4.0 client does
 * not emit it.
 */
describe("ASP.NET Library: binding existing entities", () => {
  const branchUrl = (id: number) => `${BASE_URL}/Branches(${id})`;

  /** Copies only this file touches, so re-binding cannot race the other test files. */
  const BOUND_ON_CREATE = 4001;
  const BOUND_TO_CONSTRAINED_NAV = 4002;
  const BOUND_WITH_401_NOTATION = 4003;

  const copyKey = (inventoryNumber: number) => ({
    MediumId: BOOK_DER_PROZESS,
    InventoryNumber: inventoryNumber,
  });

  test("create with a binding links the entity", async () => {
    const created = await LIBRARY.Copies()
      .create({
        MediumId: BOOK_DER_PROZESS,
        InventoryNumber: BOUND_ON_CREATE,
        Condition: 1,
        IsLoanable: true,
        WeightKg: 0.4,
        "Location@odata.bind": branchUrl(BRANCH_CENTRAL),
      })
      .execute();

    expect(created.status).toBe(201);

    const location = await LIBRARY.Copies(copyKey(BOUND_ON_CREATE)).Location().query().execute();

    expect(location.data.Id).toBe(BRANCH_CENTRAL);
    expect(location.data.Name).toBe("Central Library");
  });

  test("patching the binding re-points the link", async () => {
    const copy = LIBRARY.Copies(copyKey(BOUND_ON_CREATE));

    const patched = await copy.patch({ "Location@odata.bind": branchUrl(BRANCH_SUBURBAN) }).execute();
    expect(patched.status).toBe(204);

    const location = await copy.Location().query().execute();
    expect(location.data.Id).toBe(BRANCH_SUBURBAN);
    // The decisive assertion. Routing the binding through Delta<T> on the server would have written the
    // new key into the *previously* linked branch instead of re-pointing the reference, leaving two
    // entities with the same key behind - and still answering 204.
    expect(location.data.Name).toBe("Suburban Branch");
  });

  test("re-binding leaves the branches themselves untouched", async () => {
    const branches = await LIBRARY.Branches()
      .query((builder, qBranch) => {
        builder.select("Id", "Name").orderBy(qBranch.Id.asc());
      })
      .execute();

    expect(branches.data.value.map((branch) => [branch.Id, branch.Name])).toStrictEqual([
      [BRANCH_CENTRAL, "Central Library"],
      [BRANCH_SUBURBAN, "Suburban Branch"],
    ]);
  });

  test("binding to null clears the link", async () => {
    const copy = LIBRARY.Copies(copyKey(BOUND_ON_CREATE));

    const patched = await copy.patch({ "Location@odata.bind": null }).execute();
    expect(patched.status).toBe(204);

    await expect(copy.Location().query().execute()).rejects.toThrow();
  });

  test("binding a navigation property backed by a referential constraint", async () => {
    // `Copy/Medium` is tied to `MediumId` by a ReferentialConstraint. That is the case the OData
    // deserializer refuses outright, so the server parses such a payload itself - see FEATURE-COVERAGE.md
    // of test-server-asp-net.
    const created = await LIBRARY.Copies()
      .create({
        MediumId: BOOK_DER_PROZESS,
        InventoryNumber: BOUND_TO_CONSTRAINED_NAV,
        Condition: 1,
        IsLoanable: true,
        WeightKg: 0.4,
        "Medium@odata.bind": `${BASE_URL}/Media(${BOOK_DER_PROZESS})`,
      })
      .execute();

    expect(created.status).toBe(201);

    const medium = await LIBRARY.Copies(copyKey(BOUND_TO_CONSTRAINED_NAV)).Medium().query().execute();
    expect(medium.data.Title).toBe("Der Prozess");
  });

  test("the server honours the 4.01 notation as well", async () => {
    // Sent by hand: a client generated for 4.0 emits `Nav@odata.bind`. The point is the server side -
    // both notations have to move the link, otherwise a client generated with `odataVersionV4: "4.01"`
    // would fail against it, silently.
    const response = await fetch(`${BASE_URL}/Copies`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        MediumId: BOOK_DER_PROZESS,
        InventoryNumber: BOUND_WITH_401_NOTATION,
        Condition: 1,
        Location: { "@id": branchUrl(BRANCH_SUBURBAN) },
      }),
    });

    expect(response.status).toBe(201);

    const location = await LIBRARY.Copies(copyKey(BOUND_WITH_401_NOTATION)).Location().query().execute();

    expect(location.data.Id).toBe(BRANCH_SUBURBAN);
    expect(location.data.Name).toBe("Suburban Branch");
  });
});
