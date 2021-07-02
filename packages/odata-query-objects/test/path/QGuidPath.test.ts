import { QGuidPath } from "./../../src/path/QGuidPath";

describe("QGuidPath test", () => {
  let toTest: QGuidPath;
  const exampleGuid = "31306815-4692-490c-9bec-a40edf70621d";

  beforeEach(() => {
    toTest = new QGuidPath("ID");
  });

  test("fails with null, undefined, empty string", () => {
    // @ts-ignore
    expect(() => new QGuidPath(null)).toThrow();
    // @ts-ignore
    expect(() => new QGuidPath()).toThrow();
    // @ts-ignore
    expect(() => new QGuidPath(undefined)).toThrow();
    expect(() => new QGuidPath("")).toThrow();
    expect(() => new QGuidPath(" ")).toThrow();
  });

  test("equals", () => {
    const result = toTest.equals(exampleGuid).toString();

    expect(result).toBe(`ID eq ${exampleGuid}`);
    expect(result).toBe(toTest.eq(exampleGuid).toString());
  });

  test("not equals", () => {
    const result = toTest.notEquals(exampleGuid).toString();

    expect(result).toBe(`ID ne ${exampleGuid}`);
    expect(result).toBe(toTest.ne(exampleGuid).toString());
  });

  test("lower than", () => {
    const result = toTest.lowerThan(exampleGuid).toString();

    expect(result).toBe(`ID lt ${exampleGuid}`);
    expect(result).toBe(toTest.lt(exampleGuid).toString());
  });

  test("lower equals", () => {
    const result = toTest.lowerEquals(exampleGuid).toString();

    expect(result).toBe(`ID le ${exampleGuid}`);
    expect(result).toBe(toTest.le(exampleGuid).toString());
  });

  test("greater than", () => {
    const result = toTest.greaterThan(exampleGuid).toString();

    expect(result).toBe(`ID gt ${exampleGuid}`);
    expect(result).toBe(toTest.gt(exampleGuid).toString());
  });

  test("greater equals", () => {
    const result = toTest.greaterEquals(exampleGuid).toString();

    expect(result).toBe(`ID ge ${exampleGuid}`);
    expect(result).toBe(toTest.ge(exampleGuid).toString());
  });

  test("in", () => {
    const result = toTest.in(exampleGuid).toString();

    expect(result).toBe(`ID eq ${exampleGuid}`);
  });

  test("in with multiple", () => {
    const result = toTest.in(exampleGuid, exampleGuid).toString();

    expect(result).toBe(`(ID eq ${exampleGuid} or ID eq ${exampleGuid})`);
  });
});
