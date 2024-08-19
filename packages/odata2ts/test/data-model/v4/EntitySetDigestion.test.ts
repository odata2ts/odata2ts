import { ODataTypesV4 } from "@odata2ts/odata-core";
import { beforeEach, describe, expect, test } from "vitest";
import { digest } from "../../../src/data-model/DataModelDigestionV4";
import { NamingHelper } from "../../../src/data-model/NamingHelper";
import { getTestConfig } from "../../test.config";
import { ODataModelBuilderV4 } from "../builder/v4/ODataModelBuilderV4";

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
    return digest(odataBuilder.getSchemas(), CONFIG, NAMING_HELPER);
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
});
