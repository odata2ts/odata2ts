import { ODataTypesV4 } from "@odata2ts/odata-core";
import { describe, expect, test } from "vitest";
import { AnnotationResolver } from "../../src/data-model/AnnotationResolver.js";
import { core, propertyPaths } from "./builder/ODataAnnotationBuilder.js";
import { ODataModelBuilderV4 } from "./builder/v4/ODataModelBuilderV4.js";

const SERVICE_NAME = "Tester";
const CONTAINER = "ENTITY_CONTAINER";
const CONCURRENCY = "Org.OData.Core.V1.OptimisticConcurrency";
const OPTIONAL_PARAMETER = "Org.OData.Core.V1.OptionalParameter";

/**
 * Runs the resolver over a built model and hands back the entity container, whose sets and singletons
 * carry whatever the resolver attached to them.
 */
function resolve(builder: ODataModelBuilderV4) {
  const schemas = builder.getSchemas();
  new AnnotationResolver(schemas as any, builder.getReferences()).resolve();
  return (schemas[0] as any).EntityContainer[0];
}

function termsOf(element: { Annotation?: Array<{ $: { Term: string } }> }) {
  return (element.Annotation ?? []).map((a) => a.$.Term);
}

describe("AnnotationResolver: entity container targets", () => {
  function builderWithCopies() {
    return new ODataModelBuilderV4(SERVICE_NAME).addEntityType("Copy", undefined, (b: any) =>
      b.addKeyProp("Id", ODataTypesV4.Guid).addProp("Condition", ODataTypesV4.Byte),
    );
  }

  test("inline on the entity set, fully qualified - how ASP.NET states it", () => {
    const builder = builderWithCopies().addEntitySet(
      "Copies",
      `${SERVICE_NAME}.Copy`,
      [],
      [propertyPaths("core", "OptimisticConcurrency", ["Condition"], { fullyQualified: true })],
    );

    expect(termsOf(resolve(builder).EntitySet[0])).toContain(CONCURRENCY);
  });

  test("inline with an alias, which the resolver expands", () => {
    const builder = builderWithCopies()
      .enableAnnotations()
      .addEntitySet(
        "Copies",
        `${SERVICE_NAME}.Copy`,
        [],
        [propertyPaths("core", "OptimisticConcurrency", ["Condition"])],
      );

    expect(termsOf(resolve(builder).EntitySet[0])).toContain(CONCURRENCY);
  });

  test("externally, targeting the container - how CAP states it, with an empty collection", () => {
    const builder = builderWithCopies()
      .enableAnnotations()
      .addEntitySet("Copies", `${SERVICE_NAME}.Copy`)
      .addExternalAnnotations(`${SERVICE_NAME}.${CONTAINER}/Copies`, [
        propertyPaths("core", "OptimisticConcurrency", []),
      ]);

    expect(termsOf(resolve(builder).EntitySet[0])).toContain(CONCURRENCY);
  });

  test("externally, targeting a singleton", () => {
    const builder = builderWithCopies()
      .enableAnnotations()
      .addSingleton("TheCopy", `${SERVICE_NAME}.Copy`)
      .addExternalAnnotations(`${SERVICE_NAME}.${CONTAINER}/TheCopy`, [
        propertyPaths("core", "OptimisticConcurrency", []),
      ]);

    expect(termsOf(resolve(builder).Singleton[0])).toContain(CONCURRENCY);
  });

  test("a qualified annotation is none of our business", () => {
    const builder = builderWithCopies()
      .enableAnnotations()
      .addEntitySet("Copies", `${SERVICE_NAME}.Copy`)
      .addExternalAnnotations(
        `${SERVICE_NAME}.${CONTAINER}/Copies`,
        [propertyPaths("core", "OptimisticConcurrency", [])],
        "SomeContext",
      );

    expect(termsOf(resolve(builder).EntitySet[0])).toStrictEqual([]);
  });

  test("a target naming an unknown set resolves to nothing and throws nothing", () => {
    const builder = builderWithCopies()
      .enableAnnotations()
      .addEntitySet("Copies", `${SERVICE_NAME}.Copy`)
      .addExternalAnnotations(`${SERVICE_NAME}.${CONTAINER}/Nope`, [
        propertyPaths("core", "OptimisticConcurrency", []),
      ]);

    expect(() => resolve(builder)).not.toThrow();
    expect(termsOf(resolve(builder).EntitySet[0])).toStrictEqual([]);
  });

  test("the entity type of a concurrency-controlled set is left alone", () => {
    const builder = builderWithCopies()
      .enableAnnotations()
      .addEntitySet("Copies", `${SERVICE_NAME}.Copy`, [], [propertyPaths("core", "OptimisticConcurrency", [])]);

    const schemas = builder.getSchemas();
    new AnnotationResolver(schemas as any, builder.getReferences()).resolve();

    expect(termsOf((schemas[0] as any).EntityType[0])).toStrictEqual([]);
  });
});

describe("AnnotationResolver: operation parameter targets", () => {
  function resolveFunctions(builder: ODataModelBuilderV4) {
    const schemas = builder.getSchemas();
    new AnnotationResolver(schemas as any, builder.getReferences()).resolve();
    return (schemas[0] as any).Function;
  }

  test("inline on the parameter, with an alias the resolver expands", () => {
    const builder = new ODataModelBuilderV4(SERVICE_NAME)
      .enableAnnotations()
      .addFunction("Search", ODataTypesV4.String, false, (b: any) =>
        b
          .addParam("term", ODataTypesV4.String, false)
          .addParam("maxResults", ODataTypesV4.Int32, false)
          .addParamAnnotations("maxResults", [core("OptionalParameter")]),
      );

    const functions = resolveFunctions(builder);
    expect(termsOf(functions[0].Parameter[1])).toContain(OPTIONAL_PARAMETER);
    expect(termsOf(functions[0].Parameter[0])).toStrictEqual([]);
  });

  test("externally, targeting a parameter by its operation's signature - how CAP states it", () => {
    const builder = new ODataModelBuilderV4(SERVICE_NAME)
      .enableAnnotations()
      .addFunction("Search", ODataTypesV4.String, false, (b: any) =>
        b.addParam("term", ODataTypesV4.String, false).addParam("maxResults", ODataTypesV4.Int32, false),
      )
      .addExternalAnnotations(`${SERVICE_NAME}.Search(Edm.String,Edm.Int32)/maxResults`, [core("OptionalParameter")]);

    const functions = resolveFunctions(builder);
    expect(termsOf(functions[0].Parameter[1])).toContain(OPTIONAL_PARAMETER);
  });

  test("the signature disambiguates between overloads sharing a name", () => {
    const builder = new ODataModelBuilderV4(SERVICE_NAME)
      .enableAnnotations()
      .addFunction("Search", ODataTypesV4.String, false, (b: any) => b.addParam("term", ODataTypesV4.String, false))
      .addFunction("Search", ODataTypesV4.String, false, (b: any) =>
        b.addParam("term", ODataTypesV4.String, false).addParam("maxResults", ODataTypesV4.Int32, false),
      )
      .addExternalAnnotations(`${SERVICE_NAME}.Search(Edm.String,Edm.Int32)/maxResults`, [core("OptionalParameter")]);

    const functions = resolveFunctions(builder);
    // the one-parameter overload must be left alone ...
    expect(termsOf(functions[0].Parameter[0])).toStrictEqual([]);
    // ... only the two-parameter overload the signature actually names gets it
    expect(termsOf(functions[1].Parameter[1])).toContain(OPTIONAL_PARAMETER);
  });

  test("a target naming an unknown parameter resolves to nothing and throws nothing", () => {
    const builder = new ODataModelBuilderV4(SERVICE_NAME)
      .enableAnnotations()
      .addFunction("Search", ODataTypesV4.String, false, (b: any) => b.addParam("term", ODataTypesV4.String, false))
      .addExternalAnnotations(`${SERVICE_NAME}.Search(Edm.String)/Nope`, [core("OptionalParameter")]);

    expect(() => resolveFunctions(builder)).not.toThrow();
    expect(termsOf(resolveFunctions(builder)[0].Parameter[0])).toStrictEqual([]);
  });
});
