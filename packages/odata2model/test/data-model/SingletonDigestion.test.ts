import { ODataModelBuilder, ODataVersion } from "./builder/ODataModelBuilder";
import { digest } from "../../src/data-model/DataModelDigestion";
import { EmitModes, Modes, RunOptions } from "../../src/OptionModel";
import { OdataTypes } from "../../src/data-model/edmx/ODataEdmxModel";

describe("Singleton Digestion Test", () => {
  const SERVICE_NAME = "SingletonTest";

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

  test("Singleton: min case", async () => {
    odataBuilder.addSingleton("Me", "User").addEntityType("User", undefined, (builder) => {
      builder.addKeyProp("id", OdataTypes.String);
    });

    const result = await doDigest();
    expect(result.getEntityContainer().singletons).toMatchObject({
      me: { odataName: "Me", name: "me", type: { name: "User" } },
    });
  });

  test("Singleton: missing EntityType", async () => {
    odataBuilder.addSingleton("Me", "User");

    // TODO: this should throw
    const result = await doDigest();
    expect(result.getEntityContainer().singletons).toMatchObject({
      me: { odataName: "Me", name: "me", type: undefined },
    });
  });

  test("Singleton: with navProps", async () => {
    const navProps = [
      { path: "bestSkill", target: "Me" },
      { path: "attitudes", target: "Me" },
    ];
    odataBuilder.addSingleton("Me", "User", navProps).addEntityType("User", undefined, (builder) => {
      builder.addKeyProp("id", OdataTypes.String);
    });

    const result = await doDigest();

    expect(result.getEntityContainer().singletons).toMatchObject({
      me: { odataName: "Me", name: "me", type: { name: "User" }, navPropBinding: navProps },
    });
  });
});
