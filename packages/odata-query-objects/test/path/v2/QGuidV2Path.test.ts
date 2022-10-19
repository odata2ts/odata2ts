import { FIXED_DATE, FIXED_STRING, fixedDateConverter } from "@odata2ts/test-converters";

import { QGuidV2Path } from "../../../src";

describe("QGuidV2Path test", () => {
  let toTest: QGuidV2Path;
  const exampleGuid = "31306815-4692-490c-9bec-a40edf70621d";
  const exampleGuidValue = `guid'${exampleGuid}'`;

  beforeEach(() => {
    toTest = new QGuidV2Path("ID");
  });

  test("get path", () => {
    expect(toTest.getPath()).toBe("ID");
  });

  test("fails with null, undefined, empty string", () => {
    // @ts-expect-error
    expect(() => new QGuidV2Path(null)).toThrow();
    // @ts-expect-error
    expect(() => new QGuidV2Path()).toThrow();
    // @ts-expect-error
    expect(() => new QGuidV2Path(undefined)).toThrow();
    expect(() => new QGuidV2Path("")).toThrow();
    expect(() => new QGuidV2Path(" ")).toThrow();
  });

  test("with converter", () => {
    const testWithConv = new QGuidV2Path("ID", fixedDateConverter);

    expect(testWithConv.gt(FIXED_DATE).toString()).toBe(`ID gt guid'${FIXED_STRING}'`);
  });

  test("is null", () => {
    expect(toTest.isNull().toString()).toBe("ID eq null");
  });

  test("is not null", () => {
    expect(toTest.isNotNull().toString()).toBe("ID ne null");
  });

  test("orderBy asc", () => {
    const result = toTest.asc().toString();

    expect(result).toBe("ID asc");
    expect(result).toBe(toTest.ascending().toString());
  });

  test("orderBy desc", () => {
    const result = toTest.desc().toString();

    expect(result).toBe("ID desc");
    expect(result).toBe(toTest.descending().toString());
  });

  test("equals", () => {
    const result = toTest.equals(exampleGuid).toString();

    expect(result).toBe(`ID eq ${exampleGuidValue}`);
    expect(result).toBe(toTest.eq(exampleGuid).toString());
  });

  test("not equals", () => {
    const result = toTest.notEquals(exampleGuid).toString();

    expect(result).toBe(`ID ne ${exampleGuidValue}`);
    expect(result).toBe(toTest.ne(exampleGuid).toString());
  });

  test("lower than", () => {
    const result = toTest.lowerThan(exampleGuid).toString();

    expect(result).toBe(`ID lt ${exampleGuidValue}`);
    expect(result).toBe(toTest.lt(exampleGuid).toString());
  });

  test("lower equals", () => {
    const result = toTest.lowerEquals(exampleGuid).toString();

    expect(result).toBe(`ID le ${exampleGuidValue}`);
    expect(result).toBe(toTest.le(exampleGuid).toString());
  });

  test("greater than", () => {
    const result = toTest.greaterThan(exampleGuid).toString();

    expect(result).toBe(`ID gt ${exampleGuidValue}`);
    expect(result).toBe(toTest.gt(exampleGuid).toString());
  });

  test("greater equals", () => {
    const result = toTest.greaterEquals(exampleGuid).toString();

    expect(result).toBe(`ID ge ${exampleGuidValue}`);
    expect(result).toBe(toTest.ge(exampleGuid).toString());
  });

  test("in", () => {
    const result = toTest.in(exampleGuid).toString();

    expect(result).toBe(`ID eq ${exampleGuidValue}`);
  });

  test("in with multiple", () => {
    const result = toTest.in(exampleGuid, exampleGuid).toString();

    expect(result).toBe(`(ID eq ${exampleGuidValue} or ID eq ${exampleGuidValue})`);
  });
});
