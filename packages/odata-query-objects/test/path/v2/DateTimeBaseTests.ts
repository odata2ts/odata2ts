import { DateTimeBasePath } from "../../../src/path/v2/DateTimeBase";
import { QNumberPath } from "../../../src";

export type DateTimeConstructor<T extends DateTimeBasePath> = new (path: string) => T;

export const EXAMPLE_TIME = "20:15:59";
export const EXAMPLE_DATE_TIME = `2021-07-03T${EXAMPLE_TIME}`;
export const EXAMPLE_DATE_TIME_OFFSET = `${EXAMPLE_DATE_TIME}Z`;

export function createBaseDateTimeTests<T extends DateTimeBasePath>(
  DtConstructor: DateTimeConstructor<T>,
  example: string,
  exampleResult: string
) {
  let toTest: T;

  beforeEach(() => {
    toTest = new DtConstructor("createdAt");
  });

  test("get path", () => {
    expect(toTest.getPath()).toBe("createdAt");
  });

  test("fails with null, undefined, empty string", () => {
    // @ts-expect-error
    expect(() => new DtConstructor(null)).toThrow();
    // @ts-expect-error
    expect(() => new DtConstructor()).toThrow();
    // @ts-expect-error
    expect(() => new DtConstructor(undefined)).toThrow();
    expect(() => new DtConstructor("")).toThrow();
    expect(() => new DtConstructor(" ")).toThrow();
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

    expect(result).toBe(`createdAt eq ${exampleResult}`);
    expect(result).toBe(toTest.eq(example).toString());
  });

  test("not equals", () => {
    const result = toTest.notEquals(example).toString();

    expect(result).toBe(`createdAt ne ${exampleResult}`);
    expect(result).toBe(toTest.ne(example).toString());
  });

  test("lower than", () => {
    const result = toTest.lowerThan(example).toString();

    expect(result).toBe(`createdAt lt ${exampleResult}`);
    expect(result).toBe(toTest.lt(example).toString());
  });

  test("lower equals", () => {
    const result = toTest.lowerEquals(example).toString();

    expect(result).toBe(`createdAt le ${exampleResult}`);
    expect(result).toBe(toTest.le(example).toString());
  });

  test("greater than", () => {
    const result = toTest.greaterThan(example).toString();

    expect(result).toBe(`createdAt gt ${exampleResult}`);
    expect(result).toBe(toTest.gt(example).toString());
  });

  test("greater equals", () => {
    const result = toTest.greaterEquals(example).toString();

    expect(result).toBe(`createdAt ge ${exampleResult}`);
    expect(result).toBe(toTest.ge(example).toString());
  });

  test("in", () => {
    const result = toTest.in(example).toString();

    expect(result).toBe(`createdAt eq ${exampleResult}`);
  });

  test("in with multiple", () => {
    const result = toTest.in(example, example).toString();

    expect(result).toBe(`(createdAt eq ${exampleResult} or createdAt eq ${exampleResult})`);
  });
}

export interface PathWithDateFunctions {
  year: () => QNumberPath;
  month: () => QNumberPath;
  day: () => QNumberPath;
}

export function createDateFunctionTests(DtConstructor: new (path: string) => PathWithDateFunctions) {
  let toTest: PathWithDateFunctions;

  beforeEach(() => {
    toTest = new DtConstructor("createdAt");
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
}

export interface PathWithTimeFunctions {
  hour: () => QNumberPath;
  minute: () => QNumberPath;
  second: () => QNumberPath;
}

export function createTimeFunctionTests(DtConstructor: new (path: string) => PathWithTimeFunctions) {
  let toTest: PathWithTimeFunctions;

  beforeEach(() => {
    toTest = new DtConstructor("createdAt");
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
}
