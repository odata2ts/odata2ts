import { QNoopPath } from "./../../src/path/QNoopPath";

describe("QNoopPath test", () => {
  test("smoke test", () => {
    const result = new QNoopPath("picture");
    expect(result.getPath()).toBe("picture");
  });

  test("fails with null, undefined, empty string", () => {
    // @ts-ignore
    expect(() => new QNoopPath(null)).toThrow();
    // @ts-ignore
    expect(() => new QNoopPath()).toThrow();
    // @ts-ignore
    expect(() => new QNoopPath(undefined)).toThrow();
    expect(() => new QNoopPath("")).toThrow();
    expect(() => new QNoopPath(" ")).toThrow();
  });
});
