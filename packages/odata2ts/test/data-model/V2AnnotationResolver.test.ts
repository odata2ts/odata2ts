import { describe, expect, test } from "vitest";
import { Annotation, ODataEdmxModelBase } from "../../src/data-model/edmx/ODataEdmxModelBase.js";
import { resolveV2Annotations } from "../../src/data-model/V2AnnotationResolver.js";

const NS_MS = "http://schemas.microsoft.com/ado/2009/02/edm/annotation";
const NS_SAP = "http://www.sap.com/Protocols/SAPData";

const COMPUTED = "Org.OData.Core.V1.Computed";
const IMMUTABLE = "Org.OData.Core.V1.Immutable";
const CONCURRENCY = "Org.OData.Core.V1.OptimisticConcurrency";

type Attributes = Record<string, string>;

interface PropertySpec {
  attributes?: Attributes;
  annotations?: Array<Annotation>;
}

/**
 * A minimal V2 document with one property, and `xmlns` declarations placeable at any level - which is
 * the whole point: servers differ on where they put them.
 */
function buildModel(
  property: PropertySpec,
  scopes: { root?: Attributes; schema?: Attributes; entityType?: Attributes } = {},
): ODataEdmxModelBase<any> {
  return {
    "edmx:Edmx": {
      $: { Version: "1.0", "xmlns:edmx": "http://schemas.microsoft.com/ado/2007/06/edmx", ...scopes.root },
      "edmx:DataServices": [
        {
          Schema: [
            {
              $: { Namespace: "Tester", ...scopes.schema },
              EntityType: [
                {
                  $: { Name: "Book", ...scopes.entityType },
                  Property: [
                    {
                      $: { Name: "Prop", Type: "Edm.String", ...property.attributes },
                      ...(property.annotations ? { Annotation: property.annotations } : {}),
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  } as unknown as ODataEdmxModelBase<any>;
}

function termsOf(model: ODataEdmxModelBase<any>): Array<string> {
  const dataService = model["edmx:Edmx"]["edmx:DataServices"][0] as any;
  const property = dataService.Schema[0].EntityType[0].Property[0];
  return (property.Annotation ?? []).map((annotation: Annotation) => annotation.$.Term);
}

function resolveTerms(property: PropertySpec, scopes?: Parameters<typeof buildModel>[1]): Array<string> {
  const model = buildModel(property, scopes);
  resolveV2Annotations(model);
  return termsOf(model);
}

describe("V2AnnotationResolver Test", () => {
  const rootScope = { root: { "xmlns:sap": NS_SAP, "xmlns:annotation": NS_MS } };

  describe("SAP creatable/updatable, which only mean anything as a pair", () => {
    test("both false: the server owns the value", () => {
      expect(resolveTerms({ attributes: { "sap:creatable": "false", "sap:updatable": "false" } }, rootScope)).toEqual([
        COMPUTED,
      ]);
    });

    test("updatable false alone: settable on insert, fixed afterwards", () => {
      expect(resolveTerms({ attributes: { "sap:updatable": "false" } }, rootScope)).toEqual([IMMUTABLE]);
    });

    test("creatable false with updatable true has no V4 counterpart and is dropped", () => {
      expect(resolveTerms({ attributes: { "sap:creatable": "false", "sap:updatable": "true" } }, rootScope)).toEqual(
        [],
      );
    });

    test("both at their default of true says nothing", () => {
      expect(resolveTerms({ attributes: { "sap:creatable": "true", "sap:updatable": "true" } }, rootScope)).toEqual([]);
    });
  });

  describe("StoreGeneratedPattern", () => {
    test.each(["Identity", "Computed"])("%s means the client never supplies a value", (pattern) => {
      expect(resolveTerms({ attributes: { "annotation:StoreGeneratedPattern": pattern } }, rootScope)).toEqual([
        COMPUTED,
      ]);
    });

    test("None says nothing", () => {
      expect(resolveTerms({ attributes: { "annotation:StoreGeneratedPattern": "None" } }, rootScope)).toEqual([]);
    });
  });

  describe("resolving the prefix rather than trusting it", () => {
    test("declared on the property itself, as Apache Olingo 2 writes it", () => {
      // Olingo re-declares the namespace on every annotated property instead of hoisting it to the root
      expect(resolveTerms({ attributes: { "sap:updatable": "false", "xmlns:sap": NS_SAP } })).toEqual([IMMUTABLE]);
    });

    test.each(["schema", "entityType"] as const)("declared on the %s in between", (level) => {
      expect(resolveTerms({ attributes: { "sap:updatable": "false" } }, { [level]: { "xmlns:sap": NS_SAP } })).toEqual([
        IMMUTABLE,
      ]);
    });

    test("a freely chosen prefix bound to the same namespace", () => {
      expect(resolveTerms({ attributes: { "foo:updatable": "false" } }, { root: { "xmlns:foo": NS_SAP } })).toEqual([
        IMMUTABLE,
      ]);
    });

    test("the conventional prefix bound to something else is not SAP's", () => {
      expect(
        resolveTerms({ attributes: { "sap:updatable": "false" } }, { root: { "xmlns:sap": "urn:something:else" } }),
      ).toEqual([]);
    });

    test("an undeclared prefix resolves to nothing", () => {
      expect(resolveTerms({ attributes: { "sap:updatable": "false" } })).toEqual([]);
    });

    test("an inner declaration shadows the outer one", () => {
      expect(
        resolveTerms(
          { attributes: { "sap:updatable": "false", "xmlns:sap": "urn:something:else" } },
          { root: { "xmlns:sap": NS_SAP } },
        ),
      ).toEqual([]);
    });

    test("an unprefixed attribute is in no namespace and therefore never matches", () => {
      expect(resolveTerms({ attributes: { updatable: "false" } }, rootScope)).toEqual([]);
    });
  });

  describe("precedence", () => {
    test("SAP outranks StoreGeneratedPattern, being the more expressive of the two", () => {
      expect(
        resolveTerms(
          { attributes: { "sap:updatable": "false", "annotation:StoreGeneratedPattern": "Computed" } },
          rootScope,
        ),
      ).toEqual([IMMUTABLE]);
    });

    test("a document stating the term itself is left alone", () => {
      const annotations = [{ $: { Term: "Core.Immutable", Bool: "true" as const } }];
      expect(
        resolveTerms({ attributes: { "sap:creatable": "false", "sap:updatable": "false" }, annotations }, rootScope),
      ).toEqual(["Core.Immutable"]);
    });

    test("an unrelated annotation does not block the translation", () => {
      const annotations = [{ $: { Term: "Core.Description", String: "Something" } }];
      expect(resolveTerms({ attributes: { "sap:updatable": "false" }, annotations }, rootScope)).toEqual([
        "Core.Description",
        IMMUTABLE,
      ]);
    });
  });
});

describe("V2AnnotationResolver: the concurrency token", () => {
  /**
   * V2 has no vocabulary annotation for optimistic concurrency. It states the concurrency token as a
   * facet of the schema language itself - `ConcurrencyMode="Fixed"` on the property computing it - which
   * is normalized here into the V4 term, so that nothing downstream learns that V2 said it differently.
   */
  function buildContainerModel(
    types: Array<{ name: string; concurrencyModes: Array<string | undefined> }>,
    sets: Array<{ name: string; entityType: string }>,
    schemaAttributes: Record<string, string> = {},
  ): ODataEdmxModelBase<any> {
    return {
      "edmx:Edmx": {
        $: { Version: "1.0", "xmlns:edmx": "http://schemas.microsoft.com/ado/2007/06/edmx" },
        "edmx:DataServices": [
          {
            Schema: [
              {
                $: { Namespace: "Tester", ...schemaAttributes },
                EntityType: types.map((type) => ({
                  $: { Name: type.name },
                  Property: type.concurrencyModes.map((mode, index) => ({
                    $: {
                      Name: `Prop${index}`,
                      Type: "Edm.String",
                      ...(mode ? { ConcurrencyMode: mode } : {}),
                    },
                  })),
                })),
                EntityContainer: [
                  {
                    $: { Name: "Container" },
                    EntitySet: sets.map((set) => ({ $: { Name: set.name, EntityType: set.entityType } })),
                  },
                ],
              },
            ],
          },
        ],
      },
    } as unknown as ODataEdmxModelBase<any>;
  }

  function setTermsOf(model: ODataEdmxModelBase<any>, index = 0): Array<string> {
    const dataService = model["edmx:Edmx"]["edmx:DataServices"][0] as any;
    const entitySet = dataService.Schema[0].EntityContainer[0].EntitySet[index];
    return (entitySet.Annotation ?? []).map((annotation: Annotation) => annotation.$.Term);
  }

  test("a Fixed property makes every set of its type concurrency-controlled", () => {
    const model = buildContainerModel(
      [{ name: "Copy", concurrencyModes: ["Fixed"] }],
      [{ name: "Copies", entityType: "Tester.Copy" }],
    );
    resolveV2Annotations(model);

    expect(setTermsOf(model)).toEqual([CONCURRENCY]);
  });

  test("ConcurrencyMode=None states the opposite", () => {
    const model = buildContainerModel(
      [{ name: "Copy", concurrencyModes: ["None"] }],
      [{ name: "Copies", entityType: "Tester.Copy" }],
    );
    resolveV2Annotations(model);

    expect(setTermsOf(model)).toEqual([]);
  });

  test("no ConcurrencyMode at all changes nothing", () => {
    const model = buildContainerModel(
      [{ name: "Copy", concurrencyModes: [undefined] }],
      [{ name: "Copies", entityType: "Tester.Copy" }],
    );
    resolveV2Annotations(model);

    expect(setTermsOf(model)).toEqual([]);
  });

  test("several Fixed properties are still one statement", () => {
    // Olingo joins every Fixed property into a single token; for us it stays a single yes
    const model = buildContainerModel(
      [{ name: "Copy", concurrencyModes: ["Fixed", "Fixed"] }],
      [{ name: "Copies", entityType: "Tester.Copy" }],
    );
    resolveV2Annotations(model);

    expect(setTermsOf(model)).toEqual([CONCURRENCY]);
  });

  test("every set of the type is marked, and no other", () => {
    const model = buildContainerModel(
      [
        { name: "Copy", concurrencyModes: ["Fixed"] },
        { name: "Book", concurrencyModes: [undefined] },
      ],
      [
        { name: "Copies", entityType: "Tester.Copy" },
        { name: "ArchivedCopies", entityType: "Tester.Copy" },
        { name: "Books", entityType: "Tester.Book" },
      ],
    );
    resolveV2Annotations(model);

    expect(setTermsOf(model, 0)).toEqual([CONCURRENCY]);
    expect(setTermsOf(model, 1)).toEqual([CONCURRENCY]);
    expect(setTermsOf(model, 2)).toEqual([]);
  });

  test("a set naming its type through the schema alias is marked too", () => {
    const model = buildContainerModel(
      [{ name: "Copy", concurrencyModes: ["Fixed"] }],
      [{ name: "Copies", entityType: "Self.Copy" }],
      { Alias: "Self" },
    );
    resolveV2Annotations(model);

    expect(setTermsOf(model)).toEqual([CONCURRENCY]);
  });

  test("the container may live in another schema than the type - Olingo does exactly that", () => {
    const model = {
      "edmx:Edmx": {
        $: { Version: "1.0", "xmlns:edmx": "http://schemas.microsoft.com/ado/2007/06/edmx" },
        "edmx:DataServices": [
          {
            Schema: [
              {
                $: { Namespace: "Library.Circulation" },
                EntityType: [
                  { $: { Name: "Copy" }, Property: [{ $: { Name: "Condition", ConcurrencyMode: "Fixed" } }] },
                ],
              },
              {
                $: { Namespace: "Library.Service" },
                EntityContainer: [
                  {
                    $: { Name: "LibraryService" },
                    EntitySet: [{ $: { Name: "Copies", EntityType: "Library.Circulation.Copy" } }],
                  },
                ],
              },
            ],
          },
        ],
      },
    } as unknown as ODataEdmxModelBase<any>;

    resolveV2Annotations(model);

    const dataService = model["edmx:Edmx"]["edmx:DataServices"][0] as any;
    const entitySet = dataService.Schema[1].EntityContainer[0].EntitySet[0];
    expect((entitySet.Annotation ?? []).map((a: Annotation) => a.$.Term)).toEqual([CONCURRENCY]);
  });

  test("a document without an entity container is left alone", () => {
    const model = buildContainerModel([{ name: "Copy", concurrencyModes: ["Fixed"] }], []);
    delete (model["edmx:Edmx"]["edmx:DataServices"][0] as any).Schema[0].EntityContainer;

    expect(() => resolveV2Annotations(model)).not.toThrow();
  });
});
