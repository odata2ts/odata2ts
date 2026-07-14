import { describe, expect, test } from "vitest";
import { CollectionResponseConverterV4 } from "../../../src";
import { BookModel, QBook } from "../../fixture/operation/BookModel";
import { createResponse } from "../../test-infra/TestResponseHelper";

describe("ModelResponseConverterV4 tests", () => {
  const MODEL_INPUT = [
    {
      Title: "Wuthering Heights",
      AUTHOR: {
        Name: "Heinz",
      },
    },
    {
      Title: "The Old Man and the Sea",
      AUTHOR: {
        Name: "Horst",
      },
    },
  ];
  const MODEL_CONVERTED: Array<BookModel> = [
    {
      title: MODEL_INPUT[0].Title,
      author: {
        name: {
          prefix: "PREFIX_",
          value: MODEL_INPUT[0].AUTHOR.Name,
        },
      },
    },
    {
      title: MODEL_INPUT[1].Title,
      author: {
        name: {
          prefix: "PREFIX_",
          value: MODEL_INPUT[1].AUTHOR.Name,
        },
      },
    },
  ];
  const TYPE_CONVERTER = new QBook();
  const MAIN_CONVERTER = new CollectionResponseConverterV4(TYPE_CONVERTER);

  test("convert", () => {
    const result = MAIN_CONVERTER.convert(createResponse({ value: MODEL_INPUT }));

    expect(result.data.value).toStrictEqual(MODEL_CONVERTED);
  });

  test("convert with extra props", () => {
    const extraProps = { x: "zbit", ZZZ: "Top" };
    const input = MODEL_INPUT.map((mi) => ({ ...mi, ...extraProps }));
    const output = MODEL_CONVERTED.map((mc) => ({ ...mc, ...extraProps }));
    const result = MAIN_CONVERTER.convert(createResponse({ value: input }));

    expect(result.data.value).toStrictEqual(output);
  });

  test("return non matching input", () => {
    const nonMatching = [
      // unknown model
      { value: [{ x: 3, y: "ho" }] },
      { value: [{ x: 33, y: "hey" }] },
      // entity not an object
      { value: ["test"] },
      // result list not an object
      { value: "test" },
      // wrong structure
      "test",
      [123],
      undefined,
    ];

    nonMatching.forEach((nm) => {
      const result = MAIN_CONVERTER.convert(createResponse(nm));
      expect(result.data).toStrictEqual(nm);
    });
  });
});
