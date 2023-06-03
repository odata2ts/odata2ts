import { ImportContainer } from "../../src/generator/ImportContainer";

describe("ImportContainer tests", function () {
  const SERVICE = "@odata2ts/odata-service";
  const API = "@odata2ts/http-client-api";
  let importContainer: ImportContainer;

  beforeEach(() => {
    importContainer = new ImportContainer({
      model: "TestModel",
      qObject: "QTest",
      service: "TestService",
    });
  });

  test("smoke test", () => {
    expect(importContainer.getImportDeclarations().length).toBe(0);
  });

  test("test adding from odata-service", () => {
    importContainer.addFromService("test");

    const importDecls = importContainer.getImportDeclarations();

    expect(importDecls.length).toBe(1);
    // expect(importDecl.moduleSpecifier).toBe(SERVICE);
    // expect(importDecl.namedImports).toStrictEqual(["test"]);
    // .toStrictEqual({ moduleSpecifier: SERVICE, namedImports: ["test"] });
    expect(importDecls[0]).toStrictEqual({
      moduleSpecifier: SERVICE,
      namedImports: ["test"],
    });
  });

  test("test adding from client API", () => {
    importContainer.addFromClientApi("test");

    const importDecls = importContainer.getImportDeclarations();

    expect(importDecls.length).toBe(1);
    expect(importDecls[0]).toStrictEqual({
      moduleSpecifier: API,
      namedImports: ["test"],
    });
  });
});
