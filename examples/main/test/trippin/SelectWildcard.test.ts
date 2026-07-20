import { describe, expect, test } from "vitest";
import { BASE_URL, ODATA_CLIENT, TRIPPIN } from "./TrippinTestConstants";

/**
 * Integration test for the $select=* wildcard, run against the actually generated Trippin client - not a
 * hand-written fixture - to prove select("*") produces the literal wildcard, combinable with other select
 * items, and works the same way inside expanding() on both entity and complex nav props.
 */
describe("Trippin: Select Wildcard ($select=*)", function () {
  test('select("*") alone', async () => {
    await TRIPPIN.people()
      .query((b) => b.select("*"))
      .execute();

    expect(ODATA_CLIENT.lastUrl).toBe(`${BASE_URL}/People?$select=*`);
  });

  test('select("*", ...) combined with a named prop', async () => {
    await TRIPPIN.people()
      .query((b) => b.select("*", "user"))
      .execute();

    expect(ODATA_CLIENT.lastUrl).toBe(`${BASE_URL}/People?$select=*,UserName`);
  });

  test("nested wildcard select via expanding() on a nav prop", async () => {
    await TRIPPIN.people()
      .query((b) => b.expanding("bestFriend", (friendBuilder) => friendBuilder.select("*")))
      .execute();

    expect(ODATA_CLIENT.lastUrl).toBe(`${BASE_URL}/People?$expand=BestFriend($select=*)`);
  });

  test("nested wildcard select via expanding() on a complex prop", async () => {
    await TRIPPIN.people()
      .query((b) => b.expanding("homeAddress", (addrBuilder) => addrBuilder.select("*")))
      .execute();

    expect(ODATA_CLIENT.lastUrl).toBe(`${BASE_URL}/People?$select=HomeAddress($select=*)`);
  });
});
