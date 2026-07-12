import { describe, expect, test } from "vitest";
import { CollectionResponseConverterV2 } from "../../../src";
import { BookModel, QBook } from "../../fixture/operation/BookModel";
import { createResponse } from "../../test-infra/TestResponseHelper";

describe("CollectionResponseConverterV2 tests", () => {
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
  const MAIN_CONVERTER = new CollectionResponseConverterV2(TYPE_CONVERTER);

  test("convert", () => {
    const result = MAIN_CONVERTER.convert(createResponse({ d: { results: MODEL_INPUT } }));

    expect(result.data.d.results).toStrictEqual(MODEL_CONVERTED);
  });

  test("convert with extra props", () => {
    const extraProps = { x: "zbit", ZZZ: "Top" };
    const input = MODEL_INPUT.map((mi) => ({ ...mi, ...extraProps }));
    const output = MODEL_CONVERTED.map((mc) => ({ ...mc, ...extraProps }));
    const result = MAIN_CONVERTER.convert(createResponse({ d: { results: input } }));

    expect(result.data.d.results).toStrictEqual(output);
  });

  test("return non matching input", () => {
    const nonMatching = [
      // unknown model
      { d: { results: [{ x: 3, y: "hex" }] } },
      { d: [{ x: 33, y: "ho" }] },
      // entity not an object
      { d: { results: ["test"] } },
      { d: ["test"] },
      // array not an object
      { d: { results: 123 } },
      { d: 123 },
      // wrong structure
      { d: "test" },
      true,
      undefined,
    ];

    nonMatching.forEach((nm) => {
      const result = MAIN_CONVERTER.convert(createResponse(nm));
      expect(result.data).toStrictEqual(nm);
    });
  });
});
