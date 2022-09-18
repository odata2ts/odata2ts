import { QDateTimeOffsetV2Path, QDateTimeV2Path, QTimeV2Path } from "../../../src";

export const EXAMPLE_PATH_NAME = "createdAt";
export const EXAMPLE_TIME = "20:15:59";
export const EXAMPLE_DATE_TIME = `2021-07-03T${EXAMPLE_TIME}`;
export const EXAMPLE_DATE_TIME_OFFSET = `${EXAMPLE_DATE_TIME}Z`;

export function createBaseDateTimeTests<T extends QDateTimeOffsetV2Path | QDateTimeV2Path | QTimeV2Path>(
  toTest: T,
  example: string,
  exampleResult: string
) {
  test("get path", () => {
    expect(toTest.getPath()).toBe(EXAMPLE_PATH_NAME);
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

export function createDateFunctionTests<T extends QDateTimeOffsetV2Path | QDateTimeV2Path>(toTest: T) {
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

export function createTimeFunctionTests<T extends QDateTimeOffsetV2Path | QDateTimeV2Path | QTimeV2Path>(toTest: T) {
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
