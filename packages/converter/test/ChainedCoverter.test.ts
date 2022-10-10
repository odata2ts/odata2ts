import { fixedNumberConverter } from "../../odata-query-objects/test/fixture/converter/FixedNumberConverter";
import { fixedPrefixConverter } from "../../odata-query-objects/test/fixture/converter/FixedPrefixConverter";
import { ChainedConverter } from "../src";

describe("ChainedConverter Test", () => {
  const toTest = new ChainedConverter(fixedNumberConverter, fixedPrefixConverter);

  test("from number to prefixed string and back", () => {
    expect(toTest.convertFrom(3)).toBe("PREFIX_3");
    expect(toTest.convertTo("PREFIX_22")).toBe(22);
  });

  test("Chained Converter: one more chaining", () => {
    const doubleChained = toTest.chain(fixedPrefixConverter);

    expect(doubleChained.convertFrom(3)).toBe("PREFIX_PREFIX_3");
    expect(doubleChained.convertTo("PREFIX_PREFIX_22")).toBe(22);
  });
});
