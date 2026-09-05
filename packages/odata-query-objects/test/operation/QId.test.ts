import { describe, expect, test } from "vitest";
import {
  BookIdFunction,
  BookIdFunctionWithConversion,
  BookIdV2Function,
  BookIdWithAlternateKeyFunction,
  ComplexBookIdFunction,
} from "../fixture/operation/IdFunction";

describe("QId Tests", () => {
  test("base props", () => {
    const exampleFunction = new BookIdFunction("EntityXy");
    expect(exampleFunction.getName()).toBe("EntityXy");
    expect(exampleFunction.isV2()).toBeFalsy();
    expect(exampleFunction.getParams().length).toBe(1);
    expect(exampleFunction.getResponseConverter()).toBeUndefined();
  });

  test("build and parse URL", () => {
    const exampleFunction = new BookIdFunction("EntityXy");
    expect(exampleFunction.buildUrl({ isbn: "123" })).toBe("EntityXy(isbn=123)");
    expect(exampleFunction.buildUrl("123")).toBe("EntityXy(123)");
    expect(exampleFunction.parseUrl("EntityXy(isbn=123)")).toMatchObject({ isbn: "123" });
    expect(exampleFunction.parseUrl("EntityXy(123)")).toBe("123");
  });

  test("encoded vs unencoded", () => {
    const exampleFunction = new BookIdFunction("EntityXy");
    const withSpecialChars = "1?2/3&";
    const encoded = "1%3F2%2F3%26";

    // not encoded
    expect(exampleFunction.buildUrl({ isbn: withSpecialChars }, true)).toBe(`EntityXy(isbn=${withSpecialChars})`);
    expect(exampleFunction.parseUrl(`EntityXy(isbn=${withSpecialChars})`, true)).toStrictEqual({
      isbn: withSpecialChars,
    });
    expect(exampleFunction.buildUrl(withSpecialChars, true)).toBe(`EntityXy(${withSpecialChars})`);
    expect(exampleFunction.parseUrl(`EntityXy(${withSpecialChars})`, true)).toBe(withSpecialChars);

    // encoded (by default)
    expect(exampleFunction.buildUrl({ isbn: withSpecialChars })).toBe(`EntityXy(isbn=${encoded})`);
    expect(exampleFunction.parseUrl(`EntityXy(isbn=${encoded})`)).toStrictEqual({ isbn: withSpecialChars });
    expect(exampleFunction.buildUrl(withSpecialChars)).toBe(`EntityXy(${encoded})`);
    expect(exampleFunction.parseUrl(`EntityXy(${encoded})`)).toBe(withSpecialChars);
  });

  test("V2 Param: with type prefix", () => {
    const exampleFunction = new BookIdV2Function("EntityXy");
    // IdFunctions are always in V4 mode, only their params are special V2 params
    expect(exampleFunction.isV2()).toBe(false);

    expect(exampleFunction.buildUrl({ isbn: "123" })).toBe("EntityXy(isbn=guid'123')");
    expect(exampleFunction.buildUrl("123")).toBe("EntityXy(guid'123')");
    expect(exampleFunction.parseUrl("EntityXy(isbn=guid'123')")).toMatchObject({ isbn: "123" });
    expect(exampleFunction.parseUrl("EntityXy(guid'123')")).toBe("123");
  });

  test("conversion", () => {
    const exampleFunction = new BookIdFunctionWithConversion("EntityXy");
    expect(exampleFunction.buildUrl({ test: 1 })).toBe("EntityXy(Test=true)");
    expect(exampleFunction.buildUrl(0)).toBe("EntityXy(false)");
    expect(exampleFunction.parseUrl("EntityXy(Test=true)")).toMatchObject({ test: 1 });
    expect(exampleFunction.parseUrl("EntityXy(true)")).toBe(1);
  });

  test("failures", () => {
    const exampleFunction = new ComplexBookIdFunction("EntityXy");

    expect(exampleFunction.buildUrl({ title: "test", author: "xxx" })).toBe("EntityXy(title='test',author='xxx')");
    expect(exampleFunction.parseUrl("EntityXy(title='test',author='xxx')")).toStrictEqual({
      title: "test",
      author: "xxx",
    });

    // @ts-expect-error
    expect(() => exampleFunction.buildUrl({ isbn: "123" })).toThrow("Unknown parameter");
    // @ts-expect-error
    expect(() => exampleFunction.buildUrl("123")).toThrow("the function requires multiple parameters!");

    expect(() => exampleFunction.parseUrl("123")).toThrow("did not yield any params");
    expect(() => exampleFunction.parseUrl("EntityXy()")).toThrow("did not yield any params");
    expect(() => exampleFunction.parseUrl("EntityXy('123')")).toThrow("the function requires multiple parameters!");
    expect(() => exampleFunction.parseUrl("EntityXy(title,author=xxx)")).toThrow("Key and value must be specified");
    expect(() => exampleFunction.parseUrl("EntityXy(tiger=xxx)")).toThrow(
      "not part of this function's method signature",
    );
  });

  describe("buildCanonicalId", () => {
    test("a bare value builds the same canonical id as buildUrl would", () => {
      const exampleFunction = new BookIdFunction("EntityXy");
      expect(exampleFunction.buildCanonicalId("123")).toBe("EntityXy(123)");
    });

    test("a clean single-key object collapses to the very same bare form - consistency is the point", () => {
      const exampleFunction = new BookIdFunction("EntityXy");
      expect(exampleFunction.buildCanonicalId({ isbn: "123" })).toBe(exampleFunction.buildCanonicalId("123"));
      expect(exampleFunction.buildCanonicalId({ isbn: "123" })).toBe("EntityXy(123)");
    });

    test("a full entity representation with unrelated fields still resolves - only the key is read out of it", () => {
      const exampleFunction = new BookIdFunction("EntityXy");
      expect(exampleFunction.buildCanonicalId({ isbn: "123", title: "The Trial" })).toBe("EntityXy(123)");
    });

    test("a composite key builds the same as buildUrl, key by key", () => {
      const exampleFunction = new ComplexBookIdFunction("EntityXy");
      expect(exampleFunction.buildCanonicalId({ title: "test", author: "xxx" })).toBe(
        "EntityXy(title='test',author='xxx')",
      );
    });

    test("a composite key survives unrelated fields alongside it too", () => {
      const exampleFunction = new ComplexBookIdFunction("EntityXy");
      expect(exampleFunction.buildCanonicalId({ title: "test", author: "xxx", extra: true })).toBe(
        "EntityXy(title='test',author='xxx')",
      );
    });

    test("a missing key property resolves to undefined - never a partial or wrong id", () => {
      const exampleFunction = new ComplexBookIdFunction("EntityXy");
      expect(exampleFunction.buildCanonicalId({ title: "test" })).toBeUndefined();
    });
  });

  describe("alternate keys", () => {
    test("getPrimaryParams always returns the first param set", () => {
      const exampleFunction = new BookIdWithAlternateKeyFunction("EntityXy");

      expect(exampleFunction.getPrimaryParams()).toHaveLength(1);
      expect(exampleFunction.getPrimaryParams()[0].getName()).toBe("id");
    });

    test("getAlternateParams returns every param set but the first", () => {
      const exampleFunction = new BookIdWithAlternateKeyFunction("EntityXy");

      const alternateParams = exampleFunction.getAlternateParams();
      expect(alternateParams).toHaveLength(1);
      expect(alternateParams[0]).toHaveLength(1);
      expect(alternateParams[0][0].getName()).toBe("ISBN");
      expect(alternateParams[0][0].getMappedName()).toBe("isbn");
    });

    test("buildUrl picks the primary key for a bare scalar value", () => {
      const exampleFunction = new BookIdWithAlternateKeyFunction("EntityXy");
      expect(exampleFunction.buildUrl("some-guid")).toBe("EntityXy(some-guid)");
    });

    test("buildUrl picks the matching alternate key by its object shape", () => {
      const exampleFunction = new BookIdWithAlternateKeyFunction("EntityXy");
      expect(exampleFunction.buildUrl({ isbn: "123" })).toBe("EntityXy(ISBN='123')");
    });

    test("parseUrl picks the matching param set by the wire names actually present", () => {
      const exampleFunction = new BookIdWithAlternateKeyFunction("EntityXy");
      expect(exampleFunction.parseUrl("EntityXy(id=abc)")).toMatchObject({ id: "abc" });
      expect(exampleFunction.parseUrl("EntityXy(ISBN='123')")).toMatchObject({ isbn: "123" });
    });
  });
});
