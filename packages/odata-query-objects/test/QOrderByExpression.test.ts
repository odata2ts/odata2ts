import { QOrderByExpression, QNumberPath, QStringPath } from "../src";

describe("QOrderByExpression test", () => {
  test("fails with null, undefined, empty string", () => {
    // @ts-ignore
    expect(() => new QOrderByExpression(null)).toThrow();
    // @ts-ignore
    expect(() => new QOrderByExpression()).toThrow();
    // @ts-ignore
    expect(() => new QOrderByExpression(undefined)).toThrow();
    expect(() => new QOrderByExpression("")).toThrow();
    expect(() => new QOrderByExpression(" ")).toThrow();
  });

  test("smoke test", () => {
    const result = new QOrderByExpression("any string will do!");
    expect(result.toString()).toBe("any string will do!");
  });
});
