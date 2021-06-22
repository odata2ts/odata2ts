import { QBooleanPath } from "../../src";

describe("QBooleanPath test", () => {
  let toTest: QBooleanPath;

  beforeEach(() => {
    toTest = new QBooleanPath("done");
  });

  test("fails with null, undefined, empty string", () => {
    // @ts-ignore
    expect(() => new QBooleanPath(null)).toThrow();
    // @ts-ignore
    expect(() => new QBooleanPath()).toThrow();
    // @ts-ignore
    expect(() => new QBooleanPath(undefined)).toThrow();
    expect(() => new QBooleanPath("")).toThrow();
    expect(() => new QBooleanPath(" ")).toThrow();
  });

  test("equals", () => {
    const value = true;
    const result = toTest.equals(value);

    expect(result.toString()).toBe("done eq true");
    expect(result.toString()).toBe(toTest.eq(value).toString());
  });

  test("isTrue", () => {
    const result = toTest.isTrue();

    expect(result.toString()).toBe("done eq true");
  });

  test("isFalse", () => {
    const result = toTest.isFalse();

    expect(result.toString()).toBe("done eq false");
  });
});
