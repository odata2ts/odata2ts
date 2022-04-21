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
});
