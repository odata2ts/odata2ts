import { ODataTypesV4 } from "@odata2ts/odata-core";

import { digest } from "../../../src/data-model/DataModelDigestionV4";
import { getDefaultConfig } from "../../../src/evaluateConfig";
import { ODataModelBuilderV4 } from "../builder/v4/ODataModelBuilderV4";

describe("Singleton Digestion Test", () => {
  const SERVICE_NAME = "SingletonTest";
  const CONFIG = getDefaultConfig();

  let odataBuilder: ODataModelBuilderV4;

  function doDigest() {
    return digest(odataBuilder.getSchema(), CONFIG);
  }

  beforeEach(() => {
    odataBuilder = new ODataModelBuilderV4(SERVICE_NAME);
  });

  test("Singleton: min case", async () => {
    odataBuilder.addSingleton("Me", "User").addEntityType("User", undefined, (builder) => {
      builder.addKeyProp("id", ODataTypesV4.String);
    });

    const result = await doDigest();
    expect(result.getEntityContainer().singletons).toMatchObject({
      me: { odataName: "Me", name: "me", entityType: { name: "User" } },
    });
  });

  test("Singleton: missing EntityType", async () => {
    odataBuilder.addSingleton("Me", "User");

    // TODO: this should throw
    const result = await doDigest();
    expect(result.getEntityContainer().singletons).toMatchObject({
      me: { odataName: "Me", name: "me", entityType: undefined },
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
      me: { odataName: "Me", name: "me", entityType: { name: "User" }, navPropBinding: navProps },
    });
  });
});
