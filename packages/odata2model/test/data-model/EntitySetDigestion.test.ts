import { ODataModelBuilder, ODataVersion } from "./builder/ODataModelBuilder";
import { digest } from "../../src/data-model/DataModelDigestion";
import { EmitModes, Modes, RunOptions } from "../../src/OptionModel";
import { ModelTypes } from "../../src/data-model/DataTypeModel";
import { OdataTypes } from "../../src/odata/ODataEdmxModel";

const NOOP_FN = () => {};

describe("EntitySet Digestion Test", () => {
  const SERVICE_NAME = "EntitySetTest";

  let odataBuilder: ODataModelBuilder;
  let runOpts: RunOptions;

  function doDigest() {
    return digest(odataBuilder.getSchema(), runOpts);
  }

  beforeEach(() => {
    odataBuilder = new ODataModelBuilder(ODataVersion.V4, SERVICE_NAME);
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
      builder.addKeyProp("id", OdataTypes.String);
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
        builder.addKeyProp("id", OdataTypes.String);
      })
      .addEntitySet("Products", "Product", navProps);

    const result = await doDigest();

    expect(result.getEntityContainer().entitySets).toMatchObject({
      products: { odataName: "Products", name: "products", entityType: { name: "Product" }, navPropBinding: navProps },
    });
  });
});
