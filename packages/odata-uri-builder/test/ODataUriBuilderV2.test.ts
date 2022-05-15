import { ODataUriBuilderV2 } from "../src/v2/ODataUriBuilderV2";
import { QPerson, qPerson } from "./fixture/types/QSimplePersonModel";
import { createBaseTests } from "./ODataUriBuilderBaseTests";

/**
 * Helper function which adds the base path.
 *
 * @param urlPart
 * @returns
 */
function addBase(urlPart: string) {
  return `/Persons?${urlPart}`;
}

describe("ODataUriBuilderV2 Test", () => {
  let toTest: ODataUriBuilderV2<QPerson>;

  createBaseTests(ODataUriBuilderV2.create);

  /**
   * Always use a new builder for each  test.
   */
  beforeEach(() => {
    toTest = ODataUriBuilderV2.create("/Persons", qPerson, { unencoded: true });
  });

  test("count: true", () => {
    const candidate = toTest.count(true).build();
    const candidate2 = toTest.count().build();
    const expected = addBase("$inlinecount=allpages");

    expect(candidate).toBe(expected);
    expect(candidate).toBe(candidate2);
  });

  test("count: false", () => {
    const candidate = toTest.count(false).build();
    const expected = "/Persons";

    expect(candidate).toBe(expected);
  });

  test("select: simple prop", () => {
    const candidate = toTest.select(qPerson.age).build();
    const expected = addBase("$select=age");

    expect(candidate).toBe(expected);
  });

  test("select: nested prop", () => {
    const candidate = toTest.select(qPerson.address.props.street).build();
    const expected = addBase("$select=Address/street");

    expect(candidate).toBe(expected);
  });

  test("select: deeply nested prop", () => {
    const candidate = toTest.select(qPerson.address.props.responsible.props.age).build();
    const expected = addBase("$select=Address/responsible/age");

    expect(candidate).toBe(expected);
  });

  test("select: mixed", () => {
    const candidate = toTest
      .select("age", qPerson.address.props.street, qPerson.address.props.responsible.props.age)
      .build();
    const expected = addBase("$select=age,Address/street,Address/responsible/age");

    expect(candidate).toBe(expected);
  });

  test("expanding: nested expand", () => {
    const candidate = toTest.expanding("address", (q) => q.responsible).build();
    const expected = addBase("$expand=Address/responsible");

    expect(candidate).toBe(expected);
  });
});
