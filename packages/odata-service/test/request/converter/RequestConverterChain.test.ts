import { ODataHttpMethods } from "@odata2ts/http-client-api";
import { FlexibleConversionModel } from "@odata2ts/odata-query-objects";
import { beforeEach, describe, expect, expectTypeOf, test } from "vitest";
import { MainRequestConverter, RequestConverterChain, RequestInfo } from "../../../src";

describe("RequestConverterChain tests", () => {
  const DEFAULT_METHOD = ODataHttpMethods.Delete;
  const DEFAULT_URL = "TEST/ing";
  const DEFAULT_HEADER = { x: "y" };
  const DEFAULT_DATA = 3;

  const testRequestInfo = new RequestInfo<number>(DEFAULT_METHOD, DEFAULT_URL, DEFAULT_HEADER, DEFAULT_DATA);

  const testRequestConverter: MainRequestConverter<number, any> = {
    convertTo(value: FlexibleConversionModel<number>) {
      return "Number: " + value;
    },
  };

  let blankCandidate: RequestConverterChain<number>;
  let testCandidate: RequestConverterChain<number>;

  beforeEach(() => {
    blankCandidate = new RequestConverterChain<number>();
    testCandidate = new RequestConverterChain(testRequestConverter);
  });

  test("regular conversion", () => {
    const blankResult = blankCandidate.convert(testRequestInfo);
    const result = testCandidate.convert(testRequestInfo);

    expectTypeOf(blankResult).toEqualTypeOf<RequestInfo<any>>();
    expect(blankResult).toStrictEqual(testRequestInfo);

    expectTypeOf(result).toEqualTypeOf<RequestInfo<any>>();
    expect(result).toStrictEqual(new RequestInfo(DEFAULT_METHOD, DEFAULT_URL, DEFAULT_HEADER, "Number: 3"));
  });

  test("prepend custom converter", () => {
    const blankResult = blankCandidate
      .prependConverter((value) => value.withData(value.data! * 2))
      .convert(testRequestInfo);
    // multiply value by 2
    const result = testCandidate
      .prependConverter((value: RequestInfo<number>) => value.withData(value.data! * 2))
      .convert(testRequestInfo);

    expectTypeOf(blankResult).toEqualTypeOf<RequestInfo<any>>();
    expectTypeOf(result).toEqualTypeOf<RequestInfo<any>>();

    expect(blankResult).toMatchObject({ ...testRequestInfo, data: 6 });
    expect(result).toStrictEqual(new RequestInfo(DEFAULT_METHOD, DEFAULT_URL, DEFAULT_HEADER, "Number: 6"));
  });

  test("prepend multiple times", () => {
    // multiply value by 2 and then 3
    testCandidate.prependConverter((value: RequestInfo<number>) => value.withData(value.data! * 2));
    testCandidate.prependConverter((value: RequestInfo<number>) => value.withData(value.data! * 3));

    expect(testCandidate.convert(testRequestInfo)).toStrictEqual(
      new RequestInfo(DEFAULT_METHOD, DEFAULT_URL, DEFAULT_HEADER, "Number: 18"),
    );
  });

  test("append custom converter", () => {
    const blankResult = blankCandidate
      .appendConverter((value) => value.withData(value.data! * 3))
      .convert(testRequestInfo);
    // append to result string
    const result = testCandidate
      .appendConverter((value: RequestInfo<string>) => value.withData(value.data + " - appended!"))
      .convert(testRequestInfo);

    expectTypeOf(blankResult).toEqualTypeOf<RequestInfo<any>>();
    expectTypeOf(result).toEqualTypeOf<RequestInfo<any>>();

    expect(blankResult).toMatchObject({ ...testRequestInfo, data: 9 });
    expect(result).toStrictEqual(new RequestInfo(DEFAULT_METHOD, DEFAULT_URL, DEFAULT_HEADER, "Number: 3 - appended!"));
  });

  test("append multiple times", () => {
    // append to result string
    testCandidate.appendConverter((value: RequestInfo<string>) => value.withData(value.data + " - appended!"));
    testCandidate.appendConverter((value: RequestInfo<string>) => value.withData(value.data + " - one more"));

    expect(testCandidate.convert(testRequestInfo)).toStrictEqual(
      new RequestInfo(DEFAULT_METHOD, DEFAULT_URL, DEFAULT_HEADER, "Number: 3 - appended! - one more"),
    );
  });

  test("throws for a main converter with wrong signature", () => {
    const invalidConverter = {} as MainRequestConverter<number, any>;
    const candidate = new RequestConverterChain(invalidConverter);

    expect(() => candidate.convert(testRequestInfo)).toThrow(
      "Wrong conversion function signature for request converter!",
    );
  });

  test("mixed append and prepend", () => {
    blankCandidate.prependConverter((value) => value.withData(value.data! * 2));
    blankCandidate.appendConverter((value) => value.withData(value.data! * 3));

    testCandidate.appendConverter((value: RequestInfo<string>) => value.withData(value.data + " - appended!"));
    testCandidate.prependConverter((value: RequestInfo<number>) => value.withData(value.data! * 2));
    testCandidate.prependConverter((value: RequestInfo<number>) => value.withData(value.data! * 3));
    testCandidate.appendConverter((value: RequestInfo<string>) => value.withData(value.data + " - one more"));

    expect(blankCandidate.convert(testRequestInfo)).toMatchObject({ ...testRequestInfo, data: 18 });
    expect(testCandidate.convert(testRequestInfo)).toStrictEqual(
      new RequestInfo(DEFAULT_METHOD, DEFAULT_URL, DEFAULT_HEADER, "Number: 18 - appended! - one more"),
    );
  });
});
