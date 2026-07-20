import { ODataVersions } from "@odata2ts/odata-core";
import { describe, expect, test, vi } from "vitest";
import { DataTypes, ReturnTypeModel } from "../../../src/data-model/DataTypeModel";
import { ImportContainer } from "../../../src/generator/ImportContainer";
import { CoreImports } from "../../../src/generator/import/ImportObjects";
import {
  importMainResponseConverter,
  importReturnType,
} from "../../../src/generator/import/ImportResponseHelper";

function mockImports() {
  return {
    addCoreLib: vi.fn((_v: ODataVersions, lib: any) => String(lib)),
    addQObject: vi.fn((qo: any) => String(qo)),
  } as unknown as ImportContainer;
}

function mkReturnType(dataType: DataTypes, isCollection: boolean): ReturnTypeModel {
  return { dataType, isCollection } as ReturnTypeModel;
}

describe("ImportResponseHelper tests", () => {
  describe("importReturnType", () => {
    test("V2: complex type (non-collection, non-primitive)", () => {
      const imports = mockImports();
      importReturnType(ODataVersions.V2, imports, mkReturnType(DataTypes.ComplexType, false));

      expect(imports.addCoreLib).toHaveBeenCalledWith(ODataVersions.V2, CoreImports.ODataComplexModelResponseV2);
    });

    test("V2: entity/model type (non-collection, non-primitive)", () => {
      const imports = mockImports();
      importReturnType(ODataVersions.V2, imports, mkReturnType(DataTypes.ModelType, false));

      expect(imports.addCoreLib).toHaveBeenCalledWith(ODataVersions.V2, CoreImports.ODataEntityModelResponseV2);
    });

    test("V4: entity/model type (non-collection, non-primitive)", () => {
      const imports = mockImports();
      importReturnType(ODataVersions.V4, imports, mkReturnType(DataTypes.ModelType, false));

      expect(imports.addCoreLib).toHaveBeenCalledWith(ODataVersions.V4, CoreImports.ODataModelResponseV4);
    });
  });

  describe("importMainResponseConverter", () => {
    test("V2: collection", () => {
      const imports = mockImports();
      importMainResponseConverter(ODataVersions.V2, imports, mkReturnType(DataTypes.ModelType, true));

      expect(imports.addQObject).toHaveBeenCalledWith("CollectionResponseConverterV2");
    });

    test("V2: entity/model type", () => {
      const imports = mockImports();
      importMainResponseConverter(ODataVersions.V2, imports, mkReturnType(DataTypes.ModelType, false));

      expect(imports.addQObject).toHaveBeenCalledWith("EntityResponseConverterV2");
    });

    test("V2: complex type", () => {
      const imports = mockImports();
      importMainResponseConverter(ODataVersions.V2, imports, mkReturnType(DataTypes.ComplexType, false));

      expect(imports.addQObject).toHaveBeenCalledWith("ComplexResponseConverterV2");
    });

    test("V2: primitive type", () => {
      const imports = mockImports();
      importMainResponseConverter(ODataVersions.V2, imports, mkReturnType(DataTypes.PrimitiveType, false));

      expect(imports.addQObject).toHaveBeenCalledWith("ValueResponseConverterV2");
    });
  });
});
