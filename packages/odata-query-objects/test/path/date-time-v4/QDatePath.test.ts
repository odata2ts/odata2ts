import { QDatePath } from "./../../../src/path/date-time-v4/QDatePath";

describe("QDatePath test", () => {
  let toTest: QDatePath;
  const example = "2021-07-03";

  beforeEach(() => {
    toTest = new QDatePath("startDate");
  });

  test("get path", () => {
    expect(toTest.getPath()).toBe("startDate");
  });

  test("fails with null, undefined, empty string", () => {
    // @ts-ignore
    expect(() => new QDatePath(null)).toThrow();
    // @ts-ignore
    expect(() => new QDatePath()).toThrow();
    // @ts-ignore
    expect(() => new QDatePath(undefined)).toThrow();
    expect(() => new QDatePath("")).toThrow();
    expect(() => new QDatePath(" ")).toThrow();
  });

  test("orderBy asc", () => {
    const result = toTest.asc().toString();

    expect(result).toBe("startDate asc");
    expect(result).toBe(toTest.ascending().toString());
  });

  test("orderBy desc", () => {
    const result = toTest.desc().toString();

    expect(result).toBe("startDate desc");
    expect(result).toBe(toTest.descending().toString());
  });

  test("equals", () => {
    const result = toTest.equals(example).toString();

    expect(result).toBe(`startDate eq ${example}`);
    expect(result).toBe(toTest.eq(example).toString());
  });

  test("not equals", () => {
    const result = toTest.notEquals(example).toString();

    expect(result).toBe(`startDate ne ${example}`);
    expect(result).toBe(toTest.ne(example).toString());
  });

  test("lower than", () => {
    const result = toTest.lowerThan(example).toString();

    expect(result).toBe(`startDate lt ${example}`);
    expect(result).toBe(toTest.lt(example).toString());
  });

  test("lower equals", () => {
    const result = toTest.lowerEquals(example).toString();

    expect(result).toBe(`startDate le ${example}`);
    expect(result).toBe(toTest.le(example).toString());
  });

  test("greater than", () => {
    const result = toTest.greaterThan(example).toString();

    expect(result).toBe(`startDate gt ${example}`);
    expect(result).toBe(toTest.gt(example).toString());
  });

  test("greater equals", () => {
    const result = toTest.greaterEquals(example).toString();

    expect(result).toBe(`startDate ge ${example}`);
    expect(result).toBe(toTest.ge(example).toString());
  });

  test("in", () => {
    const result = toTest.in(example).toString();

    expect(result).toBe(`startDate eq ${example}`);
  });

  test("in with multiple", () => {
    const result = toTest.in(example, example).toString();

    expect(result).toBe(`(startDate eq ${example} or startDate eq ${example})`);
  });

  test("year", () => {
    const result = toTest.year().equals(2021).toString();

    expect(result).toBe("year(startDate) eq 2021");
  });

  test("month", () => {
    const result = toTest.month().equals(7).toString();
    expect(result).toBe("month(startDate) eq 7");
  });

  test("day", () => {
    const result = toTest.day().eq(3).toString();

    expect(result).toBe("day(startDate) eq 3");
  });
});
