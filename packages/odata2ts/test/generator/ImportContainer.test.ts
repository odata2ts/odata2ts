import { ODataVersions } from "@odata2ts/odata-core";
import { beforeEach, describe, expect, test } from "vitest";
import { getDefaultConfig } from "../../src";
import { NamespaceWithAlias } from "../../src/data-model/DataModel";
import { digest } from "../../src/data-model/DataModelDigestionV4";
import { NamingHelper } from "../../src/data-model/NamingHelper";
import { ClientApiImports, ServiceImports } from "../../src/generator/import/ImportObjects";
import { ImportContainer } from "../../src/generator/ImportContainer";
import { ODataModelBuilderV4 } from "../data-model/builder/v4/ODataModelBuilderV4";

describe("ImportContainer tests", function () {
  const SERVICE_NAME = "Test";
  const NAMESPACE: NamespaceWithAlias = [SERVICE_NAME];
  const SERVICE = "@odata2ts/odata-service";
  const API = "@odata2ts/http-client-api";
  const DEFAULT_FILE_NAME = "testObject";
  let odataBuilder: ODataModelBuilderV4;
  let importContainer: ImportContainer;

  async function createImportContainer(
    fileName: string = DEFAULT_FILE_NAME,
    path: string = "",
    reservedNames: Array<string> = [],
    bundledFileGenreation = true,
  ) {
    const defaultConfig = getDefaultConfig();
    const dataModel = await digest(
      odataBuilder.getSchemas(),
      defaultConfig,
      new NamingHelper(defaultConfig, SERVICE_NAME, [NAMESPACE]),
    );
    importContainer = new ImportContainer(
      path,
      fileName,
      dataModel,
      {
        model: "TestModel",
        qObject: "QTest",
        service: "TestService",
      },
      bundledFileGenreation,
      reservedNames,
    );
  }

  beforeEach(() => {
    odataBuilder = new ODataModelBuilderV4(SERVICE_NAME);
  });

  test("smoke test", async () => {
    await createImportContainer();

    expect(importContainer.getImportDeclarations().length).toBe(0);
  });

  test("test adding from odata-service", async () => {
    await createImportContainer();

    importContainer.addServiceObject(ODataVersions.V4, ServiceImports.ODataService);

    const importDecls = importContainer.getImportDeclarations();

    expect(importDecls.length).toBe(1);
    expect(importDecls[0]).toStrictEqual({
      isTypeOnly: false,
      moduleSpecifier: SERVICE,
      namedImports: [{ name: "ODataService", alias: undefined }],
    });
  });

  test("test adding from client API", async () => {
    await createImportContainer();

    importContainer.addClientApi(ClientApiImports.HttpResponseModel);
    importContainer.addClientApi(ClientApiImports.ODataHttpClient);

    const importDecls = importContainer.getImportDeclarations();

    expect(importDecls.length).toBe(1);
    expect(importDecls[0]).toStrictEqual({
      isTypeOnly: true,
      moduleSpecifier: API,
      namedImports: [
        { name: "HttpResponseModel", alias: undefined },
        { name: "ODataHttpClient", alias: undefined },
      ],
    });
  });

  test("addQObject then addQObjectType: regular import wins, no typeOnly added", async () => {
    await createImportContainer();

    importContainer.addQObject("QFoo");
    importContainer.addQObjectType("QFoo");

    const importDecls = importContainer.getImportDeclarations();

    expect(importDecls.length).toBe(1);
    expect(importDecls[0].isTypeOnly).toBe(false);
  });

  test("addQObjectType then addQObject: typeOnly import gets removed, regular added", async () => {
    await createImportContainer();

    importContainer.addQObjectType("QFoo");
    importContainer.addQObject("QFoo");

    const importDecls = importContainer.getImportDeclarations();

    expect(importDecls.length).toBe(1);
    expect(importDecls[0].isTypeOnly).toBe(false);
  });

  describe("generated imports: bundled file generation", () => {
    test("addGeneratedModel: same file is a no-op (returns name unchanged, no import)", async () => {
      await createImportContainer("TestModel");

      const result = importContainer.addGeneratedModel("", "SomeName");

      expect(result).toBe("SomeName");
      expect(importContainer.getImportDeclarations().length).toBe(0);
    });

    test("addGeneratedModel/QObject/Service import from the shared bundle file", async () => {
      await createImportContainer();

      importContainer.addGeneratedModel("Test.Foo", "FooModel");
      importContainer.addGeneratedQObject("Test.Foo", "qFoo");
      importContainer.addGeneratedService("Test.Foo", "FooService");

      const importDecls = importContainer.getImportDeclarations();

      expect(importDecls).toHaveLength(3);
      expect(importDecls.map((d) => d.moduleSpecifier)).toStrictEqual(["./TestModel", "./QTest", "./TestService"]);
    });
  });

  describe("generated imports: non-bundled file generation", () => {
    test("addGeneratedModel: unknown fqName throws", async () => {
      await createImportContainer(DEFAULT_FILE_NAME, "", [], false);

      expect(() => importContainer.addGeneratedModel("Test.DoesNotExist", "Foo")).toThrow(
        "Cannot find model by its fully qualified name: Test.DoesNotExist!",
      );
    });

    test("addGeneratedQObject: unknown fqName throws", async () => {
      await createImportContainer(DEFAULT_FILE_NAME, "", [], false);

      expect(() => importContainer.addGeneratedQObject("Test.DoesNotExist", "qFoo")).toThrow(
        "Cannot find q-object by its fully qualified name: Test.DoesNotExist!",
      );
    });

    test("addGeneratedModel/QObject: empty fqName falls back to the main file names", async () => {
      await createImportContainer(DEFAULT_FILE_NAME, "", [], false);

      importContainer.addGeneratedModel("", "FooModel");
      importContainer.addGeneratedQObject("", "qFoo");

      const importDecls = importContainer.getImportDeclarations();

      expect(importDecls.map((d) => d.moduleSpecifier)).toStrictEqual(["./TestModel", "./QTest"]);
    });

    test("addGeneratedModel/QObject/Service: known fqName imports from the model's own file", async () => {
      odataBuilder.addEntityType("Foo", undefined, (builder) => builder.addKeyProp("id", "Edm.String"));
      await createImportContainer(DEFAULT_FILE_NAME, "", [], false);

      importContainer.addGeneratedModel("Test.Foo", "FooModel");
      importContainer.addGeneratedQObject("Test.Foo", "qFoo");
      importContainer.addGeneratedService("Test.Foo", "FooService");

      const importDecls = importContainer.getImportDeclarations();

      expect(importDecls.length).toBe(3);
      expect(importDecls.every((d) => typeof d.moduleSpecifier === "string" && d.moduleSpecifier.length > 0)).toBe(
        true,
      );
    });

    test("addGeneratedQBaseObject: model without a base type throws", async () => {
      odataBuilder.addEntityType("Foo", undefined, (builder) => builder.addKeyProp("id", "Edm.String"));
      await createImportContainer(DEFAULT_FILE_NAME, "", [], false);
      const dataModel = (importContainer as any).dataModel;
      const model = dataModel.getModel("Test.Foo");

      expect(() => importContainer.addGeneratedQBaseObject(model)).toThrow("Model Test.Foo has no base type!");
    });

    test("addGeneratedQBaseObject: model with a base type imports the base q-object", async () => {
      odataBuilder
        .addEntityType("Parent", undefined, (builder) => builder.addKeyProp("id", "Edm.String"))
        .addEntityType("Child", { baseType: "Test.Parent" }, () => {});
      await createImportContainer(DEFAULT_FILE_NAME, "", [], false);
      const dataModel = (importContainer as any).dataModel;
      // qBaseName is assigned to the base type (Parent) during digestion, not the subtype (Child)
      const model = dataModel.getModel("Test.Parent");

      const result = importContainer.addGeneratedQBaseObject(model);

      expect(result).toBe(model.qBaseName);
      expect(importContainer.getImportDeclarations().length).toBe(1);
    });

    test("addGeneratedQBaseObject: bundled file generation imports the base q-object from the shared bundle", async () => {
      odataBuilder
        .addEntityType("Parent", undefined, (builder) => builder.addKeyProp("id", "Edm.String"))
        .addEntityType("Child", { baseType: "Test.Parent" }, () => {});
      await createImportContainer();
      const dataModel = (importContainer as any).dataModel;
      const model = dataModel.getModel("Test.Parent");

      importContainer.addGeneratedQBaseObject(model);

      const importDecls = importContainer.getImportDeclarations();
      expect(importDecls[0].moduleSpecifier).toBe("./QTest");
    });
  });
});
