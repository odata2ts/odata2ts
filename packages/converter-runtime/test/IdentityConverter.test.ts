import { getIdentityConverter } from "../src";

describe("IdentityConverter Test", () => {
  const toTest = getIdentityConverter();

  test("simply outputs the input", () => {
    expect(toTest.convertFrom(3)).toBe(3);
    expect(toTest.convertTo(3)).toBe(3);
    expect(toTest.convertFrom("22")).toBe("22");
    expect(toTest.convertTo("22")).toBe("22");
    expect(toTest.convertFrom(false)).toBe(false);
    expect(toTest.convertTo(true)).toBe(true);
    expect(toTest.convertFrom(null)).toBe(null);
    expect(toTest.convertFrom(undefined)).toBe(undefined);
  });
});
