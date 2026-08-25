import { afterAll, describe, expect, expectTypeOf, test } from "vitest";
import { qCopy } from "../../src-generated/library-401/library-circulation/index.js";
import { qCopy as qCopy40 } from "../../src-generated/library/library-circulation/index.js";
import { LIBRARY_401 } from "../Library401Constants.js";
import { BOOK_DER_PROZESS, BRANCH_CENTRAL, LIBRARY } from "../LibraryTestConstants.js";

/**
 * `odataVersionV4: "4.01"` - the same model, targeting the newer minor version.
 *
 * Unlike `enableNativeInOperator`, this axis cannot be split across the two V4 packages: CAP does not speak
 * 4.01, so this server is the only place it can be held against anything at all. It is therefore additive,
 * a client next to the 4.0 one rather than instead of it - which is what the difference needs anyway, since
 * the whole point is that the two spell the same thing differently.
 *
 * Everything the option changes is payload, so a type check sees none of it:
 *
 * - a binding loses its own property name (`Location@odata.bind` becomes `Location: {"@id": …}`)
 * - control information in a response drops the prefix (`@odata.count` becomes `@count`)
 *
 * `Binding.test.ts` already showed that this server *accepts* the 4.01 spelling, by sending one by hand -
 * a 4.0 client cannot produce it. What was missing is the other half: that odata2ts actually emits it.
 */
describe("ASP.NET Library: OData 4.01", () => {
  const BOUND_BY_401_CLIENT = 4201;
  const copyKey = (inventoryNumber: number) => ({ MediumId: BOOK_DER_PROZESS, InventoryNumber: inventoryNumber });

  afterAll(async () => {
    await LIBRARY_401.Copies(copyKey(BOUND_BY_401_CLIENT)).delete().ignoreETag().execute();
  });

  test("the two versions spell a binding differently", () => {
    // Asserted on the query object rather than through a request, because this is the one difference which
    // a server would happily swallow either way: ASP.NET accepts both notations, so a client emitting the
    // 4.0 one while announcing 4.01 would pass every behavioural test.
    const payload = { Location: { "@id": BRANCH_CENTRAL } };

    const as401 = qCopy.convertToOData(payload);
    const as40 = qCopy40.convertToOData(payload);

    // 4.01: the navigation property itself carries the reference
    expect(as401).toStrictEqual({ Location: { "@id": "Branches(1)" } });
    // 4.0: a property of its own, and the URL rather than an object
    expect(as40).toStrictEqual({ "Location@odata.bind": "Branches(1)" });
  });

  test("a binding written by the 4.01 client is honoured by the server", async () => {
    const created = await LIBRARY_401.Copies()
      .create({
        MediumId: BOOK_DER_PROZESS,
        InventoryNumber: BOUND_BY_401_CLIENT,
        Condition: 1,
        IsLoanable: true,
        WeightKg: 0.4,
        Location: { "@id": BRANCH_CENTRAL },
      })
      .execute();

    expect(created.status).toBe(201);

    // read the link back through the 4.0 client: the same server row, reached the ordinary way
    const location = await LIBRARY.Copies(copyKey(BOUND_BY_401_CLIENT)).Location().query().execute();
    expect(location.data.Id).toBe(BRANCH_CENTRAL);
    expect(location.data.Name).toBe("Central Library");
  });

  test("the response carries the short form of the control information, as typed", async () => {
    const result = await LIBRARY_401.Media()
      .query((builder) => builder.count().top(0))
      .execute();

    expect(result.status).toBe(200);

    // The typing follows the configured version ...
    expectTypeOf(result.data["@count"]).toEqualTypeOf<number | undefined>();
    // ... and the 4.0 client's spelling is not part of that type at all
    // @ts-expect-error - "@odata.count" does not exist on a 4.01 response model
    result.data["@odata.count"];

    // ... and so does what actually arrives. Which is the whole reason a GET has to declare the version
    // too: the header governs the *response* shape as much as it governs how a payload is read, and until
    // it was sent on reads this server answered in 4.0 form while the client was typed for 4.01.
    const asReceived = result.data as unknown as Record<string, unknown>;
    expect(asReceived["@count"]).toBeDefined();
    expect(asReceived["@odata.count"]).toBeUndefined();
    expect(result.data["@count"]).toBeGreaterThan(0);
  });

  test("the 4.0 client is unaffected and keeps the prefixed form", async () => {
    // The counter-sample: the version header is only declared where it was configured, so a client on the
    // default keeps talking 4.0 and reading the prefixed control information.
    const result = await LIBRARY.Media()
      .query((builder) => builder.count().top(0))
      .execute();

    expect(Number(result.data["@odata.count"])).toBeGreaterThan(0);
  });
});
