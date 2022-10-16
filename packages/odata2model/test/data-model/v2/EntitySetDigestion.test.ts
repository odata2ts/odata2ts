import { ODataTypesV2 } from "@odata2ts/odata-core";

import { digest } from "../../../src/data-model/DataModelDigestionV2";
import { EmitModes, Modes, RunOptions } from "../../../src/OptionModel";
import { ODataModelBuilderV2 } from "../builder/v2/ODataModelBuilderV2";

describe("EntitySet Digestion Test", () => {
  const SERVICE_NAME = "EntitySetTest";

  let odataBuilder: ODataModelBuilderV2;
  let runOpts: RunOptions;

  function doDigest() {
    return digest(odataBuilder.getSchema(), runOpts);
  }

  beforeEach(() => {
    odataBuilder = new ODataModelBuilderV2(SERVICE_NAME);
    runOpts = {
      mode: Modes.all,
      emitMode: EmitModes.js_dts,
      output: "ignore",
      prettier: false,
      debug: false,
      modelPrefix: "",
      modelSuffix: "",
    };
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
