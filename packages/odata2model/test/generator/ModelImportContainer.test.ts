import { ModelImportContainer } from "../../src/generator/ModelImportContainer";

describe("ModelImportContainer tests", function () {
  const SERVICE = "@odata2ts/odata-service";
  const API = "@odata2ts/odata-client-api";
  let importContainer: ModelImportContainer;

  beforeEach(() => {
    importContainer = new ModelImportContainer();
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
