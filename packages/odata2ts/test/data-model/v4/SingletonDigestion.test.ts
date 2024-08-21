import { ODataTypesV4 } from "@odata2ts/odata-core";
import { beforeEach, describe, expect, test } from "vitest";
import { digest } from "../../../src/data-model/DataModelDigestionV4";
import { NamingHelper } from "../../../src/data-model/NamingHelper";
import { getTestConfig } from "../../test.config";
import { ODataModelBuilderV4 } from "../builder/v4/ODataModelBuilderV4";

describe("Singleton Digestion Test", () => {
  const SERVICE_NAME = "SingletonTest";
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

  test("Singleton: min case", async () => {
    odataBuilder.addSingleton("Me", withNs("User")).addEntityType("User", undefined, (builder) => {
      builder.addKeyProp("id", ODataTypesV4.String);
    });

    const result = await doDigest();
    expect(result.getEntityContainer().singletons).toMatchObject({
      [withEc("Me")]: {
        fqName: withEc("Me"),
        odataName: "Me",
        name: "Me",
        entityType: { name: "User" },
      },
    });
  });

  test("Singleton: missing EntityType", async () => {
    odataBuilder.addSingleton("Me", withNs("User"));

    await expect(() => doDigest()).rejects.toThrow('Entity type "SingletonTest.User" not found!');
  });

  test("Singleton: with navProps", async () => {
    const navProps = [
      { path: "bestSkill", target: "Me" },
      { path: "attitudes", target: "Me" },
    ];
    odataBuilder.addSingleton("Me", withNs("User"), navProps).addEntityType("User", undefined, (builder) => {
      builder.addKeyProp("id", ODataTypesV4.String);
    });

    const result = await doDigest();

    expect(result.getEntityContainer().singletons).toMatchObject({
      [withEc("Me")]: {
        fqName: withEc("Me"),
        odataName: "Me",
        name: "Me",
        entityType: { name: "User" },
        navPropBinding: navProps,
      },
    });
  });
});
