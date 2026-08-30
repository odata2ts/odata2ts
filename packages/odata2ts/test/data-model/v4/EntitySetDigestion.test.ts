import { ODataTypesV4 } from "@odata2ts/odata-core";
import { beforeEach, describe, expect, test } from "vitest";
import { digest } from "../../../src/data-model/DataModelDigestionV4.js";
import { Annotation } from "../../../src/data-model/edmx/ODataEdmxModelBase.js";
import { NamingHelper } from "../../../src/data-model/NamingHelper.js";
import { getTestConfig } from "../../test.config.js";
import { alternateKeys, propertyPaths } from "../builder/ODataAnnotationBuilder.js";
import { ODataModelBuilderV4 } from "../builder/v4/ODataModelBuilderV4.js";

describe("EntitySet Digestion Test", () => {
  const SERVICE_NAME = "EntitySetTest";
  const CONFIG = getTestConfig();
  const NAMING_HELPER = new NamingHelper(CONFIG, SERVICE_NAME);

  let odataBuilder: ODataModelBuilderV4;

  function withNs(name: string) {
    return `${SERVICE_NAME}.${name}`;
  }
  function withEc(name: string) {
    return `ENTITY_CONTAINER.${name}`;
  }

  function doDigest() {
    // the references carry the vocabulary aliases; without them an annotation written as `Core.X`
    // never resolves to its fully qualified term
    return digest(odataBuilder.getSchemas(), CONFIG, NAMING_HELPER, odataBuilder.getReferences());
  }

  beforeEach(() => {
    odataBuilder = new ODataModelBuilderV4(SERVICE_NAME);
  });

  test("EntitySet: min case", async () => {
    odataBuilder.addEntitySet("Products", withNs("Product")).addEntityType("Product", undefined, (builder) => {
      builder.addKeyProp("id", ODataTypesV4.String);
    });

    const result = await doDigest();
    expect(result.getEntityContainer().entitySets).toMatchObject({
      [withEc("Products")]: { odataName: "Products", name: "Products", entityType: { name: "Product" } },
    });
  });

  test("EntitySet: missing EntityType", async () => {
    odataBuilder.addEntitySet("Products", withNs("Product"));

    await expect(() => doDigest()).rejects.toThrow('Entity type "EntitySetTest.Product" not found!');
  });

  test("EntitySet: with navProps", async () => {
    const navProps = [
      { path: "bestBuy", target: "Products" },
      { path: "specialOffers", target: "Products" },
    ];
    odataBuilder
      .addEntityType("Product", undefined, (builder) => {
        builder.addKeyProp("id", ODataTypesV4.String);
      })
      .addEntitySet("Products", withNs("Product"), navProps);

    const result = await doDigest();

    expect(result.getEntityContainer().entitySets).toMatchObject({
      [withEc("Products")]: {
        odataName: "Products",
        name: "Products",
        entityType: { name: "Product" },
        navPropBinding: navProps,
      },
    });
  });

  describe("Optimistic concurrency", () => {
    function addProduct() {
      return odataBuilder.enableAnnotations().addEntityType("Product", undefined, (builder) => {
        builder.addKeyProp("id", ODataTypesV4.String);
        builder.addProp("condition", ODataTypesV4.Byte);
      });
    }

    async function entitySet(name: string) {
      return (await doDigest()).getEntityContainer().entitySets[withEc(name)];
    }

    test("no annotation means not controlled", async () => {
      addProduct().addEntitySet("Products", withNs("Product"));

      expect((await entitySet("Products")).concurrencyControlled).toBe(false);
      expect((await doDigest()).getEntityType(withNs("Product"))!.concurrencyControlled).toBe(false);
    });

    test("the term makes the set controlled", async () => {
      addProduct().addEntitySet(
        "Products",
        withNs("Product"),
        [],
        [propertyPaths("core", "OptimisticConcurrency", ["condition"])],
      );

      expect((await entitySet("Products")).concurrencyControlled).toBe(true);
    });

    test("an empty collection is still the term - CAP's form", async () => {
      addProduct().addEntitySet(
        "Products",
        withNs("Product"),
        [],
        [propertyPaths("core", "OptimisticConcurrency", [])],
      );

      expect((await entitySet("Products")).concurrencyControlled).toBe(true);
    });

    test("stated externally against the container", async () => {
      addProduct()
        .addEntitySet("Products", withNs("Product"))
        .addExternalAnnotations(`${SERVICE_NAME}.ENTITY_CONTAINER/Products`, [
          propertyPaths("core", "OptimisticConcurrency", []),
        ]);

      expect((await entitySet("Products")).concurrencyControlled).toBe(true);
    });

    test("the entity type learns it from its set", async () => {
      addProduct().addEntitySet(
        "Products",
        withNs("Product"),
        [],
        [propertyPaths("core", "OptimisticConcurrency", [])],
      );

      expect((await doDigest()).getEntityType(withNs("Product"))!.concurrencyControlled).toBe(true);
    });

    test("of two sets of one type, a single controlled one is enough", async () => {
      addProduct()
        .addEntitySet("Products", withNs("Product"))
        .addEntitySet("ArchivedProducts", withNs("Product"), [], [propertyPaths("core", "OptimisticConcurrency", [])]);

      expect((await entitySet("Products")).concurrencyControlled).toBe(false);
      expect((await entitySet("ArchivedProducts")).concurrencyControlled).toBe(true);
      // the generated service is per type, so the stricter of the two wins there
      expect((await doDigest()).getEntityType(withNs("Product"))!.concurrencyControlled).toBe(true);
    });

    test("the switch turns the evaluation off", async () => {
      addProduct().addEntitySet(
        "Products",
        withNs("Product"),
        [],
        [propertyPaths("core", "OptimisticConcurrency", [])],
      );

      const config = { ...CONFIG, annotations: { disableOptimisticConcurrency: true } };
      const result = await digest(odataBuilder.getSchemas(), config, NAMING_HELPER, odataBuilder.getReferences());

      expect(result.getEntityContainer().entitySets[withEc("Products")].concurrencyControlled).toBe(false);
      expect(result.getEntityType(withNs("Product"))!.concurrencyControlled).toBe(false);
    });
  });

  describe("Alternate keys", () => {
    function addProduct(entityTypeAnnotations?: Array<Annotation>) {
      return odataBuilder.enableAnnotations().addEntityType("Product", undefined, (builder) => {
        builder.addKeyProp("id", ODataTypesV4.String);
        builder.addProp("isbn", ODataTypesV4.String);
        builder.addProp("title", ODataTypesV4.String);
        builder.addProp("author", ODataTypesV4.String);
        if (entityTypeAnnotations) {
          builder.addTypeAnnotations(entityTypeAnnotations);
        }
      });
    }

    async function productType() {
      return (await doDigest()).getEntityType(withNs("Product"))!;
    }

    test("no annotation means no alternate keys", async () => {
      addProduct().addEntitySet("Products", withNs("Product"));

      expect((await productType()).alternateKeys).toEqual([]);
    });

    test("single-property alternate key from the entity type", async () => {
      addProduct([alternateKeys([[{ name: "isbn" }]])]).addEntitySet("Products", withNs("Product"));

      const result = await productType();
      expect(result.alternateKeys).toHaveLength(1);
      expect(result.alternateKeys[0]).toHaveLength(1);
      expect(result.alternateKeys[0][0].property.odataName).toBe("isbn");
      expect(result.alternateKeys[0][0].alias).toBeUndefined();
    });

    test("alias is carried through", async () => {
      addProduct([alternateKeys([[{ name: "isbn", alias: "ISBN" }]])]).addEntitySet("Products", withNs("Product"));

      const result = await productType();
      expect(result.alternateKeys[0][0].alias).toBe("ISBN");
    });

    test("composite alternate key", async () => {
      addProduct([alternateKeys([[{ name: "title" }, { name: "author" }]])]).addEntitySet(
        "Products",
        withNs("Product"),
      );

      const result = await productType();
      expect(result.alternateKeys[0].map((ref) => ref.property.odataName)).toEqual(["title", "author"]);
    });

    test("multiple alternate keys", async () => {
      addProduct([alternateKeys([[{ name: "isbn" }], [{ name: "title" }, { name: "author" }]])]).addEntitySet(
        "Products",
        withNs("Product"),
      );

      const result = await productType();
      expect(result.alternateKeys).toHaveLength(2);
      expect(result.alternateKeys[0].map((r) => r.property.odataName)).toEqual(["isbn"]);
      expect(result.alternateKeys[1].map((r) => r.property.odataName)).toEqual(["title", "author"]);
    });

    test("an entity-set-only annotation is ignored - only the EntityType target is read", async () => {
      // Core.AlternateKeys' AppliesTo also lists EntitySet and NavigationProperty, but odata2ts
      // generates one Q*Id shared by every access path (the entity set, every navigation property,
      // every subtype cast) - only a statement that applies to the type itself can be represented there
      addProduct().addEntitySet(
        "Products",
        withNs("Product"),
        [],
        [alternateKeys([[{ name: "title" }, { name: "author" }]])],
      );

      const result = await productType();
      expect(result.alternateKeys).toEqual([]);
    });

    test("the entity type's own annotation applies regardless of what the entity set additionally states", async () => {
      addProduct([alternateKeys([[{ name: "isbn" }]])]).addEntitySet(
        "Products",
        withNs("Product"),
        [],
        [alternateKeys([[{ name: "title" }, { name: "author" }]])],
      );

      const result = await productType();
      expect(result.alternateKeys).toHaveLength(1);
      expect(result.alternateKeys[0].map((r) => r.property.odataName)).toEqual(["isbn"]);
    });

    test("the switch turns the evaluation off", async () => {
      addProduct([alternateKeys([[{ name: "isbn" }]])]).addEntitySet("Products", withNs("Product"));

      const config = { ...CONFIG, annotations: { disableAlternateKeys: true } };
      const result = await digest(odataBuilder.getSchemas(), config, NAMING_HELPER, odataBuilder.getReferences());

      expect(result.getEntityType(withNs("Product"))!.alternateKeys).toEqual([]);
    });

    test("an unresolvable property name throws", async () => {
      addProduct([alternateKeys([[{ name: "doesNotExist" }]])]).addEntitySet("Products", withNs("Product"));

      await expect(() => doDigest()).rejects.toThrow(
        "Core.AlternateKeys: property [doesNotExist] not found among the properties of entity type [EntitySetTest.Product]!",
      );
    });
  });
});
