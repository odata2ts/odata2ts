import { ODataTypesV2 } from "@odata2ts/odata-core";
import { beforeEach, describe, expect, test } from "vitest";
import { digest } from "../../../src/data-model/DataModelDigestionV2.js";
import { NamingHelper } from "../../../src/data-model/NamingHelper.js";
import { getTestConfig } from "../../test.config.js";
import { alternateKeys } from "../builder/ODataAnnotationBuilder.js";
import { ODataModelBuilderV2 } from "../builder/v2/ODataModelBuilderV2.js";

describe("EntitySet Digestion Test", () => {
  const SERVICE_NAME = "EntitySetTest";
  const CONFIG = getTestConfig();
  const NAMING_HELPER = new NamingHelper(CONFIG, SERVICE_NAME);

  let odataBuilder: ODataModelBuilderV2;

  function withNs(name: string) {
    return `${SERVICE_NAME}.${name}`;
  }
  function withEc(name: string) {
    return `ENTITY_CONTAINER.${name}`;
  }

  function doDigest() {
    return digest(odataBuilder.getSchemas(), CONFIG, NAMING_HELPER);
  }

  beforeEach(() => {
    odataBuilder = new ODataModelBuilderV2(SERVICE_NAME);
  });

  test("EntitySet: min case", async () => {
    odataBuilder.addEntitySet("Products", withNs("Product")).addEntityType("Product", undefined, (builder) => {
      return builder.addKeyProp("id", ODataTypesV2.String);
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

  test("EntitySet: navigation property binding from AssociationSet", async () => {
    odataBuilder
      .addEntityType("Category", undefined, (b) => b.addKeyProp("id", ODataTypesV2.String))
      .addEntityType("Product", undefined, (b) =>
        b.addKeyProp("id", ODataTypesV2.String).addNavProp("category", withNs("Category"), "Product_Category", "0..1"),
      )
      .addEntitySet("Products", withNs("Product"))
      .addEntitySet("Categories", withNs("Category"))
      .addAssociationSet("Products_Categories", withNs("Product_Category"), [
        { role: "Product_Category", entitySet: "Products" },
        { role: "Category_Product", entitySet: "Categories" },
      ]);

    const result = await doDigest();

    expect(result.getEntityContainer().entitySets[withEc("Products")]).toMatchObject({
      navPropBinding: [{ path: "category", target: "Categories" }],
    });
  });

  test("EntitySet: AssociationSet disambiguates two entity sets of the same type", async () => {
    // the heuristic of matching by entity type alone cannot resolve this, the AssociationSet can
    odataBuilder
      .addEntityType("BusinessPartner", undefined, (b) => b.addKeyProp("id", ODataTypesV2.String))
      .addEntityType("Order", undefined, (b) =>
        b
          .addKeyProp("id", ODataTypesV2.String)
          .addNavProp("customer", withNs("BusinessPartner"), "Order_Customer", "0..1", {
            fromRole: "Order_Customer",
            toRole: "Customer_Orders",
          })
          .addNavProp("supplier", withNs("BusinessPartner"), "Order_Supplier", "0..1", {
            fromRole: "Order_Supplier",
            toRole: "Supplier_Orders",
          }),
      )
      .addEntitySet("Orders", withNs("Order"))
      .addEntitySet("Customers", withNs("BusinessPartner"))
      .addEntitySet("Suppliers", withNs("BusinessPartner"))
      .addAssociationSet("Orders_Customers", withNs("Order_Customer"), [
        { role: "Order_Customer", entitySet: "Orders" },
        { role: "Customer_Orders", entitySet: "Customers" },
      ])
      .addAssociationSet("Orders_Suppliers", withNs("Order_Supplier"), [
        { role: "Order_Supplier", entitySet: "Orders" },
        { role: "Supplier_Orders", entitySet: "Suppliers" },
      ]);

    const result = await doDigest();

    expect(result.getEntityContainer().entitySets[withEc("Orders")]).toMatchObject({
      navPropBinding: [
        { path: "customer", target: "Customers" },
        { path: "supplier", target: "Suppliers" },
      ],
    });
  });

  test("EntitySet: the AssociationSet of the very entity set is used", async () => {
    // the same association realized twice: the binding of Orders must not pick up the one of Archive
    odataBuilder
      .addEntityType("Category", undefined, (b) => b.addKeyProp("id", ODataTypesV2.String))
      .addEntityType("Product", undefined, (b) =>
        b.addKeyProp("id", ODataTypesV2.String).addNavProp("category", withNs("Category"), "Product_Category", "0..1"),
      )
      .addEntitySet("Products", withNs("Product"))
      .addEntitySet("ArchivedProducts", withNs("Product"))
      .addEntitySet("Categories", withNs("Category"))
      .addEntitySet("ArchivedCategories", withNs("Category"))
      .addAssociationSet("Archive", withNs("Product_Category"), [
        { role: "Product_Category", entitySet: "ArchivedProducts" },
        { role: "Category_Product", entitySet: "ArchivedCategories" },
      ])
      .addAssociationSet("Current", withNs("Product_Category"), [
        { role: "Product_Category", entitySet: "Products" },
        { role: "Category_Product", entitySet: "Categories" },
      ]);

    const result = await doDigest();

    expect(result.getEntityContainer().entitySets[withEc("Products")]).toMatchObject({
      navPropBinding: [{ path: "category", target: "Categories" }],
    });
    expect(result.getEntityContainer().entitySets[withEc("ArchivedProducts")]).toMatchObject({
      navPropBinding: [{ path: "category", target: "ArchivedCategories" }],
    });
  });

  test("EntitySet: without AssociationSet the binding stays empty", async () => {
    odataBuilder
      .addEntityType("Category", undefined, (b) => b.addKeyProp("id", ODataTypesV2.String))
      .addEntityType("Product", undefined, (b) =>
        b.addKeyProp("id", ODataTypesV2.String).addNavProp("category", withNs("Category"), "Product_Category", "0..1"),
      )
      .addEntitySet("Products", withNs("Product"))
      .addEntitySet("Categories", withNs("Category"));

    const result = await doDigest();

    expect(result.getEntityContainer().entitySets[withEc("Products")]).toMatchObject({ navPropBinding: [] });
  });

  test("Core.AlternateKeys is a V4 concept - a V2 service stating it anyway is ignored", async () => {
    // CAP does state this term on V2 metadata too, but it is odata2ts' own decision to read it for V4 only
    odataBuilder
      .enableAnnotations()
      .addEntityType("Product", undefined, (builder) => {
        builder.addKeyProp("id", ODataTypesV2.String);
        builder.addProp("isbn", ODataTypesV2.String);
        builder.addTypeAnnotations([alternateKeys([[{ name: "isbn" }]])]);
      })
      .addEntitySet("Products", withNs("Product"));

    const result = await doDigest();

    expect(result.getEntityType(withNs("Product"))!.alternateKeys).toEqual([]);
  });
});
