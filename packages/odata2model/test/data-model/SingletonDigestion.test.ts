import { digest } from "../../src/data-model/DataModelDigestionV4";
import { EmitModes, Modes, RunOptions } from "../../src/OptionModel";
import { ODataTypesV4 } from "../../src/data-model/edmx/ODataEdmxModelV4";
import { ODataModelBuilderV4 } from "./builder/v4/ODataModelBuilderV4";

describe("Singleton Digestion Test", () => {
  const SERVICE_NAME = "SingletonTest";

  let odataBuilder: ODataModelBuilderV4;
  let runOpts: RunOptions;

  function doDigest() {
    return digest(odataBuilder.getSchema(), runOpts);
  }

  beforeEach(() => {
    odataBuilder = new ODataModelBuilderV4(SERVICE_NAME);
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
      builder.addKeyProp("id", ODataTypesV4.String);
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
      builder.addKeyProp("id", ODataTypesV4.String);
    });

    const result = await doDigest();

    expect(result.getEntityContainer().singletons).toMatchObject({
      me: { odataName: "Me", name: "me", type: { name: "User" }, navPropBinding: navProps },
    });
  });
});
