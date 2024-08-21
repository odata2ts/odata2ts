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
});
