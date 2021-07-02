import { QBinaryPath } from "./../../src";

describe("QBinaryPath test", () => {
  test("smoke test", () => {
    const result = new QBinaryPath("picture");
    expect(result.getPath()).toBe("picture");
  });

  test("fails with null, undefined, empty string", () => {
    // @ts-ignore
    expect(() => new QBinaryPath(null)).toThrow();
    // @ts-ignore
    expect(() => new QBinaryPath()).toThrow();
    // @ts-ignore
    expect(() => new QBinaryPath(undefined)).toThrow();
    expect(() => new QBinaryPath("")).toThrow();
    expect(() => new QBinaryPath(" ")).toThrow();
  });
});
