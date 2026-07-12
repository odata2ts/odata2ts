import { describe, expect, test } from "vitest";
import { ModelResponseConverterV4 } from "../../../src";
import { BookModel, QBook } from "../../fixture/operation/BookModel";
import { createResponse } from "../../test-infra/TestResponseHelper";

describe("ModelResponseConverterV4 tests", () => {
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
  const MAIN_CONVERTER = new ModelResponseConverterV4(TYPE_CONVERTER);

  test("convert", () => {
    const result = MAIN_CONVERTER.convert(createResponse(MODEL_INPUT));

    expect(result.data).toStrictEqual(MODEL_CONVERTED);
  });

  test("convert with extra props", () => {
    const extraProps = { x: "zbit", ZZZ: "Top" };
    const result = MAIN_CONVERTER.convert(createResponse({ ...MODEL_INPUT, ...extraProps }));

    expect(result.data).toStrictEqual({ ...MODEL_CONVERTED, ...extraProps });
  });

  test("return non matching input", () => {
    const nonMatching = [
      // unknown model
      { x: 1, y: "test" },
      // not an object
      "test",
      123,
      undefined,
    ];

    nonMatching.forEach((nm) => {
      const result = MAIN_CONVERTER.convert(createResponse(nm));
      expect(result.data).toStrictEqual(nm);
    });
  });
});
