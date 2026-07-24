import { describe, expect, test } from "vitest";
import { BASE_URL, ODATA_CLIENT, TRIPPIN } from "./TrippinTestConstants.js";

/**
 * Integration test for deep select on complex-typed properties via the unified `expanding()`, run against
 * the actually generated Trippin client - not a hand-written fixture - to prove the generator wires complex
 * properties (Person.HomeAddress, Person.AddressInfo, Location.City) to the same expanding() mechanism as
 * navigation properties, with the engine dynamically choosing $select=Prop(...) instead of $expand=Prop(...).
 */
describe("Trippin: Deep Select for Complex Types", function () {
  test("expanding a to-one complex prop (homeAddress) renders as $select, no $expand", async () => {
    await TRIPPIN.people()
      .query((b) => b.expanding("homeAddress", (addrBuilder) => addrBuilder.select("address")))
      .execute();

    expect(ODATA_CLIENT.lastUrl).toBe(`${BASE_URL}/People?$select=HomeAddress($select=Address)`);
  });

  test("expanding a complex prop nested inside another complex prop (homeAddress/city) stays inline", async () => {
    await TRIPPIN.people()
      .query((b) =>
        b.expanding("homeAddress", (addrBuilder) => {
          addrBuilder.expanding("city", (cityBuilder) => {
            cityBuilder.select("name");
          });
        }),
      )
      .execute();

    expect(ODATA_CLIENT.lastUrl).toBe(`${BASE_URL}/People?$select=HomeAddress($select=City($select=Name))`);
  });

  test("expanding a complex prop nested inside an entity nav prop (bestFriend/homeAddress) hoists nothing, stays inline", async () => {
    await TRIPPIN.people()
      .query((b) =>
        b.expanding("bestFriend", (friendBuilder) => {
          friendBuilder.expanding("homeAddress", (addrBuilder) => {
            addrBuilder.select("address");
          });
        }),
      )
      .execute();

    expect(ODATA_CLIENT.lastUrl).toBe(`${BASE_URL}/People?$expand=BestFriend($select=HomeAddress($select=Address))`);
  });

  test("expanding a to-many complex prop (addressInfo) keeps collection-only ops incl. search", async () => {
    await TRIPPIN.people()
      .query((b) =>
        b.expanding("addressInfo", (nested, qLocation) => {
          nested.select("address").filter(qLocation.address.startsWith("1")).top(1).skip(0).count().search("Seattle");
        }),
      )
      .execute();

    expect(ODATA_CLIENT.lastUrl).toBe(
      `${BASE_URL}/People?$select=AddressInfo($select=Address;$filter=startswith(Address,'1');$count=true;$top=1;$skip=0;$search=Seattle)`,
    );
  });

  test("expanding a to-one complex prop narrows the nested builder to model ops, same as a to-one nav prop", () => {
    TRIPPIN.people().query((b) => {
      b.expanding("homeAddress", (nested, qLocation) => {
        nested.select("address");

        // @ts-expect-error: filter is not available for a to-one expanded model, even a complex one
        nested.filter(qLocation.address.eq("x"));
        // @ts-expect-error: top is not available for a to-one expanded model, even a complex one
        nested.top(1);
      });
    });
  });

  // plain expand() stays entity-only in V4 (already covered for homeAddress/addressInfo in Query.test.ts,
  // "the Non-Expandables" - deep select via expanding() is the only way to reach a complex property in V4)
});
