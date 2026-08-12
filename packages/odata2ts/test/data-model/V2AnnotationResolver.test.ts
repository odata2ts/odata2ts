import { describe, expect, test } from "vitest";
import { Annotation, ODataEdmxModelBase } from "../../src/data-model/edmx/ODataEdmxModelBase.js";
import { resolveV2Annotations } from "../../src/data-model/V2AnnotationResolver.js";

const NS_MS = "http://schemas.microsoft.com/ado/2009/02/edm/annotation";
const NS_SAP = "http://www.sap.com/Protocols/SAPData";

const COMPUTED = "Org.OData.Core.V1.Computed";
const IMMUTABLE = "Org.OData.Core.V1.Immutable";

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
