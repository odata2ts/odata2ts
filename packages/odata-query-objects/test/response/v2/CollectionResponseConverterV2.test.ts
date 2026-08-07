import { describe, expect, test } from "vitest";
import { CollectionResponseConverterV2 } from "../../../src";
import { QBookV2 } from "../../fixture/BindingModel";
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

  describe("asV4", () => {
    const AS_V4_CONVERTER = new CollectionResponseConverterV2(TYPE_CONVERTER, true);

    test("convert into V4 shaped { value: [...] }", () => {
      const result = AS_V4_CONVERTER.convert(createResponse({ d: { results: MODEL_INPUT } }));

      expect(result.data).toStrictEqual({ value: MODEL_CONVERTED });
    });

    test("maps __count and __next to @odata.count / @odata.nextLink", () => {
      const result = AS_V4_CONVERTER.convert(
        createResponse({
          d: {
            results: MODEL_INPUT,
            __count: "2",
            __next: "https://services.odata.org/OData/OData.svc$skiptoken=12",
          },
        }),
      );

      expect(result.data).toStrictEqual({
        value: MODEL_CONVERTED,
        "@odata.count": 2,
        "@odata.nextLink": "https://services.odata.org/OData/OData.svc$skiptoken=12",
      });
    });

    test("supports V1 responses (no results wrapper)", () => {
      const result = AS_V4_CONVERTER.convert(createResponse({ d: MODEL_INPUT }));

      expect(result.data).toStrictEqual({ value: MODEL_CONVERTED });
    });

    test("reshapes __metadata and drops deferred navigation properties of each entity", () => {
      const converter = new CollectionResponseConverterV2(new QBookV2(), true);

      const result = converter.convert(
        createResponse({
          d: {
            results: [
              {
                ID: 1,
                __metadata: { uri: "Books(1)", type: "NS.Book" },
                Author: { __deferred: { uri: "Books(1)/Author" } },
              },
            ],
          },
        }),
      );

      expect(result.data).toStrictEqual({
        value: [{ id: 1, "@odata.id": "Books(1)", "@odata.type": "NS.Book" }],
      });
    });

    test("return non matching input unchanged", () => {
      // { d: { results: 123 } } is deliberately not part of this list: since "results" is not an object,
      // the V1 fallback kicks in and treats { results: 123 } itself as the (nonsensical) V1 body.
      const nonMatching = [{ d: "test" }, { test: 123 }, true, undefined];

      nonMatching.forEach((nm) => {
        const result = AS_V4_CONVERTER.convert(createResponse(nm));
        expect(result.data).toStrictEqual(nm);
      });
    });
  });
});
