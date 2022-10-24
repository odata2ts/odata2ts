import { ODataTypesV2 } from "@odata2ts/odata-core";

import { digest } from "../../../src/data-model/DataModelDigestionV2";
import { getDefaultConfig } from "../../../src/evaluateConfig";
import { ODataModelBuilderV2 } from "../builder/v2/ODataModelBuilderV2";

describe("EntitySet Digestion Test", () => {
  const SERVICE_NAME = "EntitySetTest";
  const CONFIG = getDefaultConfig();

  let odataBuilder: ODataModelBuilderV2;

  function doDigest() {
    return digest(odataBuilder.getSchema(), CONFIG);
  }

  beforeEach(() => {
    odataBuilder = new ODataModelBuilderV2(SERVICE_NAME);
  });

  test("EntitySet: min case", async () => {
    odataBuilder.addEntitySet("Products", "Product").addEntityType("Product", undefined, (builder) => {
      builder.addKeyProp("id", ODataTypesV2.String);
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
});
