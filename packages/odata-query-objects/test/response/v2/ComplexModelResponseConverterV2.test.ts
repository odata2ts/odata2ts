import { describe, expect, test } from "vitest";
import { ComplexResponseConverterV2 } from "../../../src";
import { BookModel, QBook } from "../../fixture/operation/BookModel";
import { createResponse } from "../../test-infra/TestResponseHelper";

describe("ComplexModelResponseConverterV2 tests", () => {
  const MODEL_INPUT = {
    Title: "Wuthering Heights",
    AUTHOR: {
      Name: "Heinz",
    },
  };
  const MODEL_CONVERTED: BookModel = {
    title: MODEL_INPUT.Title,
    author: {
      name: {
        prefix: "PREFIX_",
        value: "Heinz",
      },
    },
  };
  const TYPE_CONVERTER = new QBook();
  const MAIN_CONVERTER = new ComplexResponseConverterV2(TYPE_CONVERTER);

  test("convert", () => {
    const result = MAIN_CONVERTER.convert(createResponse({ d: { Address: MODEL_INPUT } }));

    expect(result.data.d).toStrictEqual(MODEL_CONVERTED);
  });

  test("convert with extra props", () => {
    const extraProps = { x: "zbit", ZZZ: "Top" };
    const result = MAIN_CONVERTER.convert(createResponse({ d: { Address: { ...MODEL_INPUT, ...extraProps } } }));

    expect(result.data.d).toStrictEqual({ ...MODEL_CONVERTED, ...extraProps });
  });

  test("return non matching input", () => {
    const nonMatching = [
      // unknown model
      { d: { x: 3, y: "hey" } },
      // not an object
      { d: "test" },
      { d: { results: "test" } },
      // wrong response structure => "d" is missing
      { test: 123 },
      null,
    ];

    nonMatching.forEach((nm) => {
      const result = MAIN_CONVERTER.convert(createResponse(nm));
      expect(result.data).toStrictEqual(nm);
    });
  });
});
