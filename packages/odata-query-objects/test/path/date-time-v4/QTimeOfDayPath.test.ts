import { QTimeOfDayPath } from "./../../../src/path/date-time-v4/QTimeOfDayPath";

describe("QTimeOfDayPath test", () => {
  let toTest: QTimeOfDayPath;
  const example = "20:15:59";

  beforeEach(() => {
    toTest = new QTimeOfDayPath("startTime");
  });

  test("get path", () => {
    expect(toTest.getPath()).toBe("startTime");
    expect(new QTimeOfDayPath("new").getPath()).toBe("new");
  });

  test("fails with null, undefined, empty string", () => {
    // @ts-expect-error
    expect(() => new QTimeOfDayPath(null)).toThrow();
    // @ts-expect-error
    expect(() => new QTimeOfDayPath()).toThrow();
    // @ts-expect-error
    expect(() => new QTimeOfDayPath(undefined)).toThrow();
    expect(() => new QTimeOfDayPath("")).toThrow();
    expect(() => new QTimeOfDayPath(" ")).toThrow();
  });

  test("orderBy asc", () => {
    const result = toTest.asc().toString();

    expect(result).toBe("startTime asc");
    expect(result).toBe(toTest.ascending().toString());
  });

  test("orderBy desc", () => {
    const result = toTest.desc().toString();

    expect(result).toBe("startTime desc");
    expect(result).toBe(toTest.descending().toString());
  });

  test("equals", () => {
    const result = toTest.equals(example).toString();

    expect(result).toBe(`startTime eq ${example}`);
    expect(result).toBe(toTest.eq(example).toString());
  });

  test("not equals", () => {
    const result = toTest.notEquals(example).toString();

    expect(result).toBe(`startTime ne ${example}`);
    expect(result).toBe(toTest.ne(example).toString());
  });

  test("lower than", () => {
    const result = toTest.lowerThan(example).toString();

    expect(result).toBe(`startTime lt ${example}`);
    expect(result).toBe(toTest.lt(example).toString());
  });

  test("lower equals", () => {
    const result = toTest.lowerEquals(example).toString();

    expect(result).toBe(`startTime le ${example}`);
    expect(result).toBe(toTest.le(example).toString());
  });

  test("greater than", () => {
    const result = toTest.greaterThan(example).toString();

    expect(result).toBe(`startTime gt ${example}`);
    expect(result).toBe(toTest.gt(example).toString());
  });

  test("greater equals", () => {
    const result = toTest.greaterEquals(example).toString();

    expect(result).toBe(`startTime ge ${example}`);
    expect(result).toBe(toTest.ge(example).toString());
  });

  test("in", () => {
    const result = toTest.in(example).toString();

    expect(result).toBe(`startTime eq ${example}`);
  });

  test("in with multiple", () => {
    const result = toTest.in(example, example).toString();

    expect(result).toBe(`(startTime eq ${example} or startTime eq ${example})`);
  });

  test("hour", () => {
    const result = toTest.hour().equals(20).toString();

    expect(result).toBe("hour(startTime) eq 20");
  });

  test("minute", () => {
    const result = toTest.minute().equals(15).toString();
    expect(result).toBe("minute(startTime) eq 15");
  });

  test("second", () => {
    const result = toTest.second().eq(3).toString();

    expect(result).toBe("second(startTime) eq 3");
  });
});
