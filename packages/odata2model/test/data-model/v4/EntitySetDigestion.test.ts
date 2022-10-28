import { ODataTypesV4 } from "@odata2ts/odata-core";

import { digest } from "../../../src/data-model/DataModelDigestionV4";
import { getDefaultConfig } from "../../../src/defaultConfig";
import { ODataModelBuilderV4 } from "../builder/v4/ODataModelBuilderV4";

describe("EntitySet Digestion Test", () => {
  const SERVICE_NAME = "EntitySetTest";
  const CONFIG = getDefaultConfig();

  let odataBuilder: ODataModelBuilderV4;

  function doDigest() {
    return digest(odataBuilder.getSchema(), CONFIG);
  }

  beforeEach(() => {
    odataBuilder = new ODataModelBuilderV4(SERVICE_NAME);
  });

  test("EntitySet: min case", async () => {
    odataBuilder.addEntitySet("Products", "Product").addEntityType("Product", undefined, (builder) => {
      builder.addKeyProp("id", ODataTypesV4.String);
    });

    const result = await doDigest();
    expect(result.getEntityContainer().entitySets).toMatchObject({
      products: { odataName: "Products", name: "products", entityType: { name: "Product" } },
    });
  });

  test("EntitySet: missing EntityType", async () => {
    odataBuilder.addEntitySet("Products", "Product");

    // TODO: this should throw
    const result = await doDigest();
    expect(result.getEntityContainer().entitySets).toMatchObject({
      products: { odataName: "Products", name: "products", entityType: undefined },
    });
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
      .addEntitySet("Products", "Product", navProps);

    const result = await doDigest();

    expect(result.getEntityContainer().entitySets).toMatchObject({
      products: { odataName: "Products", name: "products", entityType: { name: "Product" }, navPropBinding: navProps },
    });
  });
});
