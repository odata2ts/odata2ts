import { QDateTimeOffsetPath } from "./../../../src/path/date-time-v4/QDateTimeOffsetPath";

describe("QDateTimeOffsetPath test", () => {
  let toTest: QDateTimeOffsetPath;
  const example = "2021-07-03T20:15:59Z";

  beforeEach(() => {
    toTest = new QDateTimeOffsetPath("createdAt");
  });

  test("get path", () => {
    expect(toTest.getPath()).toBe("createdAt");
  });

  test("fails with null, undefined, empty string", () => {
    // @ts-ignore
    expect(() => new QDateTimeOffsetPath(null)).toThrow();
    // @ts-ignore
    expect(() => new QDateTimeOffsetPath()).toThrow();
    // @ts-ignore
    expect(() => new QDateTimeOffsetPath(undefined)).toThrow();
    expect(() => new QDateTimeOffsetPath("")).toThrow();
    expect(() => new QDateTimeOffsetPath(" ")).toThrow();
  });

  test("orderBy asc", () => {
    const result = toTest.asc().toString();

    expect(result).toBe("createdAt asc");
    expect(result).toBe(toTest.ascending().toString());
  });

  test("orderBy desc", () => {
    const result = toTest.desc().toString();

    expect(result).toBe("createdAt desc");
    expect(result).toBe(toTest.descending().toString());
  });

  test("equals", () => {
    const result = toTest.equals(example).toString();

    expect(result).toBe(`createdAt eq ${example}`);
    expect(result).toBe(toTest.eq(example).toString());
  });

  test("not equals", () => {
    const result = toTest.notEquals(example).toString();

    expect(result).toBe(`createdAt ne ${example}`);
    expect(result).toBe(toTest.ne(example).toString());
  });

  test("lower than", () => {
    const result = toTest.lowerThan(example).toString();

    expect(result).toBe(`createdAt lt ${example}`);
    expect(result).toBe(toTest.lt(example).toString());
  });

  test("lower equals", () => {
    const result = toTest.lowerEquals(example).toString();

    expect(result).toBe(`createdAt le ${example}`);
    expect(result).toBe(toTest.le(example).toString());
  });

  test("greater than", () => {
    const result = toTest.greaterThan(example).toString();

    expect(result).toBe(`createdAt gt ${example}`);
    expect(result).toBe(toTest.gt(example).toString());
  });

  test("greater equals", () => {
    const result = toTest.greaterEquals(example).toString();

    expect(result).toBe(`createdAt ge ${example}`);
    expect(result).toBe(toTest.ge(example).toString());
  });

  test("in", () => {
    const result = toTest.in(example).toString();

    expect(result).toBe(`createdAt eq ${example}`);
  });

  test("in with multiple", () => {
    const result = toTest.in(example, example).toString();

    expect(result).toBe(`(createdAt eq ${example} or createdAt eq ${example})`);
  });

  test("year", () => {
    const result = toTest.year().equals(2021).toString();

    expect(result).toBe("year(createdAt) eq 2021");
  });

  test("month", () => {
    const result = toTest.month().equals(7).toString();
    expect(result).toBe("month(createdAt) eq 7");
  });

  test("day", () => {
    const result = toTest.day().eq(3).toString();

    expect(result).toBe("day(createdAt) eq 3");
  });

  test("hour", () => {
    const result = toTest.hour().equals(20).toString();

    expect(result).toBe("hour(createdAt) eq 20");
  });

  test("minute", () => {
    const result = toTest.minute().equals(15).toString();
    expect(result).toBe("minute(createdAt) eq 15");
  });

  test("second", () => {
    const result = toTest.second().eq(3).toString();

    expect(result).toBe("second(createdAt) eq 3");
  });

  test("date", () => {
    const result = toTest.date().equals("2021-07-03").toString();
    expect(result).toBe("date(createdAt) eq 2021-07-03");
  });

  test("time", () => {
    const result = toTest.time().eq("20:15:59").toString();

    expect(result).toBe("time(createdAt) eq 20:15:59");
  });
});
