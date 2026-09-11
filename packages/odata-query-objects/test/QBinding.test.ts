import { describe, expect, test } from "vitest";
import { QBinding } from "../src";
import {
  QAuthorId,
  QBookV2,
  QBookV40,
  QBookV401,
  QGuidBookV2,
  QGuidBookV40,
  QGuidBookV401,
} from "./fixture/BindingModel";

/**
 * Binding an already existing entity to a navigation property, stated by the key of that entity.
 *
 * The user facing models spell it as {@code {"@id": key}} in every OData version - assembling the URL of
 * the referenced entity is exactly what they are spared. Turning that key into the notation the targeted
 * version asks for happens here, on the way out.
 */
describe("QBinding: binding by key", () => {
  const qBook40 = new QBookV40();
  const qBook401 = new QBookV401();
  const qBookV2 = new QBookV2();

  test("4.0 keeps the binding apart from the payload", () => {
    const result = qBook40.convertToOData({ id: 1, author: { "@id": 3 } });

    expect(result).toStrictEqual({ ID: 1, "Author@odata.bind": "Authors(3)" });
  });

  test("4.01 states the binding by the navigation property itself", () => {
    const result = qBook401.convertToOData({ id: 1, author: { "@id": 3 } });

    expect(result).toStrictEqual({ ID: 1, Author: { "@id": "Authors(3)" } });
  });

  test("V2 states the binding in the metadata notation", () => {
    const result = qBookV2.convertToOData({ id: 1, author: { "@id": 3 } });

    expect(result).toStrictEqual({ ID: 1, Author: { __metadata: { uri: "Authors(3)" } } });
  });

  test("the key is accepted in its long form as well", () => {
    const result = qBook40.convertToOData({ author: { "@id": { id: 3 } } });

    expect(result).toStrictEqual({ "Author@odata.bind": "Authors(ID=3)" });
  });

  test("null clears the link, under the property carrying the binding", () => {
    expect(qBook40.convertToOData({ author: null })).toStrictEqual({ "Author@odata.bind": null });
    expect(qBook401.convertToOData({ author: null })).toStrictEqual({ Author: null });
  });

  test("a deep insert is converted as it always was", () => {
    const result = qBook40.convertToOData({ id: 1, author: { id: 3, name: "Kafka" } });

    expect(result).toStrictEqual({ ID: 1, Author: { ID: 3, NAME: "Kafka" } });
  });

  test("4.0 splits a mixed collection into two properties", () => {
    const result = qBook40.convertToOData({
      relatedAuthors: [{ "@id": 3 }, { id: 4, name: "Kafka" }, { "@id": { id: 5 } }],
    });

    // the notation has a name of its own for the binding, so both shapes cannot share one array
    expect(result).toStrictEqual({
      "RelatedAuthors@odata.bind": ["Authors(3)", "Authors(ID=5)"],
      RelatedAuthors: [{ ID: 4, NAME: "Kafka" }],
    });
  });

  test("4.01 keeps a mixed collection in one array, in the given order", () => {
    const result = qBook401.convertToOData({
      relatedAuthors: [{ "@id": 3 }, { id: 4, name: "Kafka" }],
    });

    expect(result).toStrictEqual({
      RelatedAuthors: [{ "@id": "Authors(3)" }, { ID: 4, NAME: "Kafka" }],
    });
  });

  test("4.0 leaves out the payload property when the collection only binds", () => {
    const result = qBook40.convertToOData({ relatedAuthors: [{ "@id": 3 }] });

    expect(result).toStrictEqual({ "RelatedAuthors@odata.bind": ["Authors(3)"] });
  });

  test("an empty collection survives, since it is meaningful on its own", () => {
    expect(qBook40.convertToOData({ relatedAuthors: [] })).toStrictEqual({ RelatedAuthors: [] });
    expect(qBook401.convertToOData({ relatedAuthors: [] })).toStrictEqual({ RelatedAuthors: [] });
  });

  test("V2 keeps the extra results wrapping of a collection", () => {
    // @ts-expect-error: the wrapping is opt-in via v2PayloadResultsWrapping
    const result = qBookV2.convertToOData({ relatedAuthors: { results: [{ "@id": 3 }, { id: 4, name: "Kafka" }] } });

    expect(result).toStrictEqual({
      RelatedAuthors: { results: [{ __metadata: { uri: "Authors(3)" } }, { ID: 4, NAME: "Kafka" }] },
    });
  });

  test("the binding is not applied on the way back", () => {
    // a response never carries a binding: the service answers with the entity itself
    const result = qBook40.convertFromOData({ ID: 1, Author: { ID: 3, NAME: "Kafka" } });

    expect(result).toStrictEqual({ id: 1, author: { id: 3, name: "Kafka" } });
  });

  test("fail: id function must be supplied", () => {
    // @ts-expect-error
    expect(() => new QBinding()).toThrow("Function which returns the id function must be supplied!");
    // @ts-expect-error
    expect(() => new QBinding(new QAuthorId("Authors"))).toThrow(
      "Function which returns the id function must be supplied!",
    );
  });

  test("4.0 is the notation by default", () => {
    expect(new QBinding(() => new QAuthorId("Authors")).getNotation()).toBe("4.0");
  });

  test("getEntitySetName returns the target entity set's own name", () => {
    expect(new QBinding(() => new QAuthorId("Authors")).getEntitySetName()).toBe("Authors");
  });

  test("buildCanonicalId builds the entity set's own canonical URL segment, single key", () => {
    expect(new QBinding(() => new QAuthorId("Authors")).buildCanonicalId(3)).toBe("Authors(3)");
  });

  test("buildCanonicalId delegates to QId.buildCanonicalId - a single-key object collapses to the same bare form", () => {
    const qId = new QBinding(() => new QAuthorId("Authors"));
    expect(qId.buildCanonicalId({ id: 3 })).toBe("Authors(3)");
  });

  test("buildCanonicalId is unaffected by the binding notation - it never wraps like format does", () => {
    expect(new QBinding(() => new QAuthorId("Authors"), "4.01").buildCanonicalId(3)).toBe("Authors(3)");
  });

  test("getCacheKeyEntitySetName falls back to the raw entity-set name where no generator-supplied name is present", () => {
    expect(new QBinding(() => new QAuthorId("Authors")).getCacheKeyEntitySetName()).toBe("Authors");
  });

  test("getCacheKeyEntitySetName returns the generator-supplied name where one is present", () => {
    expect(new QBinding(() => new QAuthorId("Authors"), "4.0", "Lib.Authors").getCacheKeyEntitySetName()).toBe(
      "Lib.Authors",
    );
  });

  test("getEntitySetName keeps returning the raw name where a generator-supplied cache-key name is present - it builds URLs and must stay the server's own name", () => {
    expect(new QBinding(() => new QAuthorId("Authors"), "4.0", "Lib.Authors").getEntitySetName()).toBe("Authors");
  });

  test("format and buildCanonicalId are unaffected by the generator-supplied cache-key name - the URL is still built from the raw name", () => {
    expect(new QBinding(() => new QAuthorId("Authors"), "4.0", "Lib.Authors").format(3)).toBe("Authors(3)");
    expect(new QBinding(() => new QAuthorId("Authors"), "4.0", "Lib.Authors").buildCanonicalId(3)).toBe("Authors(3)");
  });
});

/**
 * A batch request reference (§11.7.6) names a preceding sub-request by its wire id, not an entity by key.
 * So where every other binding value is assembled into a key-predicate URL, the reference token goes out
 * verbatim and the service resolves it against that sub-request's answer. The key type is a string (a GUID),
 * which is what lets the string token be stated in a bind at all - see the `ref` helper it pairs with.
 */
describe("QBinding: a batch request reference", () => {
  test("4.0 passes the token through verbatim, keeping its own binding name", () => {
    const result = new QGuidBookV40().convertToOData({ author: { "@id": "$1" } });

    expect(result).toStrictEqual({ "Author@odata.bind": "$1" });
  });

  test("4.01 passes the token through verbatim, inline by the navigation property", () => {
    const result = new QGuidBookV401().convertToOData({ author: { "@id": "$1" } });

    expect(result).toStrictEqual({ Author: { "@id": "$1" } });
  });

  test("V2 passes the token through verbatim, in the metadata notation", () => {
    const result = new QGuidBookV2().convertToOData({ author: { "@id": "$1" } });

    expect(result).toStrictEqual({ Author: { __metadata: { uri: "$1" } } });
  });

  test("an ordinary key is still assembled into a URL, not mistaken for a reference", () => {
    const result = new QGuidBookV40().convertToOData({ author: { "@id": "11111111-1111-1111-1111-111111111111" } });

    expect(result).toStrictEqual({ "Author@odata.bind": "Authors(11111111-1111-1111-1111-111111111111)" });
  });

  test("a $-prefixed value that is not a wire id is a key, so it is assembled too", () => {
    const result = new QGuidBookV40().convertToOData({ author: { "@id": "$1a" } });

    expect(result).toStrictEqual({ "Author@odata.bind": "Authors(%241a)" });
  });
});
