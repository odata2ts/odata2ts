import { ODataTypesV4 } from "@odata2ts/odata-core";
import { beforeEach, describe, expect, test } from "vitest";
import { digest } from "../../../src/data-model/DataModelDigestionV4.js";
import { NamingHelper } from "../../../src/data-model/NamingHelper.js";
import { getTestConfig } from "../../test.config.js";
import { alternateKeys, propertyPaths } from "../builder/ODataAnnotationBuilder.js";
import { ODataModelBuilderV4 } from "../builder/v4/ODataModelBuilderV4.js";

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
    // the references carry the vocabulary aliases; without them an annotation written as `Core.X`
    // never resolves to its fully qualified term
    return digest(odataBuilder.getSchemas(), CONFIG, NAMING_HELPER, odataBuilder.getReferences());
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

  describe("Optimistic concurrency", () => {
    /**
     * `Core.OptimisticConcurrency` declares `AppliesTo="EntitySet"`, but that attribute states intent
     * rather than a restriction - CSDL 14.1.2 asks clients to "be prepared for any term to be applied to
     * any model element", and `Singleton` is a listed symbolic value there. A singleton is a resource
     * with an ETag like any other, so the term is read here too.
     */
    function addUser() {
      return odataBuilder.enableAnnotations().addEntityType("User", undefined, (builder) => {
        builder.addKeyProp("id", ODataTypesV4.String);
      });
    }

    async function singleton(name: string) {
      return (await doDigest()).getEntityContainer().singletons[withEc(name)];
    }

    test("no annotation means not controlled", async () => {
      addUser().addSingleton("Me", withNs("User"));

      expect((await singleton("Me")).concurrencyControlled).toBe(false);
    });

    test("the term makes the singleton controlled", async () => {
      addUser().addSingleton("Me", withNs("User"), [], [propertyPaths("core", "OptimisticConcurrency", [])]);

      expect((await singleton("Me")).concurrencyControlled).toBe(true);
    });

    test("stated externally against the container", async () => {
      addUser()
        .addSingleton("Me", withNs("User"))
        .addExternalAnnotations(`${SERVICE_NAME}.ENTITY_CONTAINER/Me`, [
          propertyPaths("core", "OptimisticConcurrency", []),
        ]);

      expect((await singleton("Me")).concurrencyControlled).toBe(true);
    });

    test("the entity type learns it from its singleton", async () => {
      addUser().addSingleton("Me", withNs("User"), [], [propertyPaths("core", "OptimisticConcurrency", [])]);

      expect((await doDigest()).getEntityType(withNs("User"))!.concurrencyControlled).toBe(true);
    });
  });

  test("Alternate keys: a singleton's own annotation is ignored - only the EntityType target is read", async () => {
    // Core.AlternateKeys' AppliesTo doesn't even list Singleton (only EntityType, EntitySet,
    // NavigationProperty) - and regardless, odata2ts generates one Q*Id shared by every access path, so
    // only a statement that applies to the type itself can be represented there
    odataBuilder
      .enableAnnotations()
      .addEntityType("User", undefined, (builder) => {
        builder.addKeyProp("id", ODataTypesV4.String);
        builder.addProp("email", ODataTypesV4.String);
        builder.addTypeAnnotations([alternateKeys([[{ name: "email", alias: "Email" }]])]);
      })
      .addSingleton("Me", withNs("User"), [], [alternateKeys([[{ name: "id" }]])]);

    const result = (await doDigest()).getEntityType(withNs("User"))!;

    expect(result.alternateKeys).toHaveLength(1);
    expect(result.alternateKeys[0].map((r) => r.property.odataName)).toEqual(["email"]);
  });
});
