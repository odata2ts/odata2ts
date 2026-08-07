import { describe, expect, test } from "vitest";
import { EntityResponseConverterV2 } from "../../../src";
import { QBookV2 } from "../../fixture/BindingModel";
import { BookModel, QBook } from "../../fixture/operation/BookModel";
import { createResponse } from "../../test-infra/TestResponseHelper";

describe("EntityModelResponseConverterV2 tests", () => {
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
  const MAIN_CONVERTER = new EntityResponseConverterV2(TYPE_CONVERTER);

  test("convert", () => {
    const result = MAIN_CONVERTER.convert(createResponse({ d: MODEL_INPUT }));

    expect(result.data.d).toStrictEqual(MODEL_CONVERTED);
  });

  test("convert with extra props", () => {
    const extraProps = { x: "zbit", ZZZ: "Top" };
    const result = MAIN_CONVERTER.convert(createResponse({ d: { ...MODEL_INPUT, ...extraProps } }));

    expect(result.data.d).toStrictEqual({ ...MODEL_CONVERTED, ...extraProps });
  });

  test("return non matching input", () => {
    const nonMatching = [
      // unknown model
      { d: { x: 3, y: "hey" } },
      { d: { results: { x: 33, y: "ho" } } },
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

  describe("asV4", () => {
    test("convert plain entity", () => {
      const converter = new EntityResponseConverterV2(new QBook(), true);

      const result = converter.convert(createResponse({ d: MODEL_INPUT }));

      expect(result.data).toStrictEqual(MODEL_CONVERTED);
    });

    test("maps __metadata to @odata.* control information", () => {
      const converter = new EntityResponseConverterV2(new QBookV2(), true);

      const result = converter.convert(
        createResponse({
          d: {
            ID: 1,
            __metadata: {
              uri: "Books(1)",
              type: "NS.Book",
              etag: 'W/"1"',
            },
          },
        }),
      );

      expect(result.data).toStrictEqual({
        id: 1,
        "@odata.id": "Books(1)",
        "@odata.type": "NS.Book",
        "@odata.etag": 'W/"1"',
      });
    });

    test("reshapes an expanded single-valued navigation property recursively", () => {
      const converter = new EntityResponseConverterV2(new QBookV2(), true);

      const result = converter.convert(
        createResponse({
          d: {
            ID: 1,
            Author: {
              ID: 2,
              NAME: "Jane Austen",
              __metadata: { uri: "Authors(2)", type: "NS.Author" },
            },
          },
        }),
      );

      expect(result.data).toStrictEqual({
        id: 1,
        author: {
          id: 2,
          name: "Jane Austen",
          "@odata.id": "Authors(2)",
          "@odata.type": "NS.Author",
        },
      });
    });

    test("drops a deferred single-valued navigation property", () => {
      const converter = new EntityResponseConverterV2(new QBookV2(), true);

      const result = converter.convert(
        createResponse({
          d: {
            ID: 1,
            Author: { __deferred: { uri: "Books(1)/Author" } },
          },
        }),
      );

      expect(result.data).toStrictEqual({ id: 1 });
      expect(result.data).not.toHaveProperty("author");
    });

    test("unwraps an expanded collection-valued navigation property instead of keeping the 'results' envelope", () => {
      const converter = new EntityResponseConverterV2(new QBookV2(), true);

      const result = converter.convert(
        createResponse({
          d: {
            ID: 1,
            RelatedAuthors: {
              results: [
                { ID: 2, NAME: "Jane Austen", __metadata: { uri: "Authors(2)" } },
                { ID: 3, NAME: "Mark Twain", __metadata: { uri: "Authors(3)" } },
              ],
            },
          },
        }),
      );

      expect(result.data).toStrictEqual({
        id: 1,
        relatedAuthors: [
          { id: 2, name: "Jane Austen", "@odata.id": "Authors(2)" },
          { id: 3, name: "Mark Twain", "@odata.id": "Authors(3)" },
        ],
      });
    });

    test("drops a deferred collection-valued navigation property", () => {
      const converter = new EntityResponseConverterV2(new QBookV2(), true);

      const result = converter.convert(
        createResponse({
          d: {
            ID: 1,
            RelatedAuthors: { __deferred: { uri: "Books(1)/RelatedAuthors" } },
          },
        }),
      );

      expect(result.data).toStrictEqual({ id: 1 });
      expect(result.data).not.toHaveProperty("relatedAuthors");
    });

    test("return non matching input unchanged", () => {
      const converter = new EntityResponseConverterV2(new QBook(), true);
      const nonMatching = [{ d: "test" }, { test: 123 }, null, undefined];

      nonMatching.forEach((nm) => {
        const result = converter.convert(createResponse(nm));
        expect(result.data).toStrictEqual(nm);
      });
    });
  });
});
