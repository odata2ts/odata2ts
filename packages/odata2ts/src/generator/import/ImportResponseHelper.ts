import { ODataVersions } from "@odata2ts/odata-core";
import { DataTypes, ReturnTypeModel } from "../../data-model/DataTypeModel.js";
import { ImportContainer } from "../ImportContainer.js";
import { CoreImports, QueryObjectImports } from "./ImportObjects.js";

export function importReturnType(
  version: ODataVersions,
  imports: ImportContainer,
  returnType: ReturnTypeModel,
): string {
  const typeToImport: CoreImports | undefined = returnType.isCollection
    ? CoreImports.ODataCollectionResponse
    : returnType.dataType === DataTypes.PrimitiveType
      ? CoreImports.ODataValueResponse
      : undefined;

  if (typeToImport) {
    return imports.addCoreLib(version, typeToImport);
  }

  return version === ODataVersions.V2
    ? importReturnTypeV2(imports, returnType)
    : importReturnTypeV4(imports, returnType);
}

function importReturnTypeV4(imports: ImportContainer, returnType: ReturnTypeModel) {
  return imports.addCoreLib(ODataVersions.V4, CoreImports.ODataModelResponseV4);
}

function importReturnTypeV2(imports: ImportContainer, returnType: ReturnTypeModel) {
  return imports.addCoreLib(
    ODataVersions.V2,
    returnType.dataType === DataTypes.ComplexType
      ? CoreImports.ODataComplexModelResponseV2
      : CoreImports.ODataEntityModelResponseV2,
  );
}

export function importMainResponseConverter(
  version: ODataVersions,
  imports: ImportContainer,
  returnType: ReturnTypeModel,
) {
  return version === ODataVersions.V2
    ? importMainResponseConverterV2(imports, returnType)
    : importMainResponseConverterV4(imports, returnType);
}

function importMainResponseConverterV4(imports: ImportContainer, returnType: ReturnTypeModel): string {
  const toImport: QueryObjectImports = returnType.isCollection
    ? QueryObjectImports.CollectionResponseConverterV4
    : returnType.dataType === DataTypes.PrimitiveType
      ? QueryObjectImports.ValueResponseConverterV4
      : QueryObjectImports.ModelResponseConverterV4;

  return imports.addQObject(toImport);
}

function importMainResponseConverterV2(imports: ImportContainer, returnType: ReturnTypeModel): string {
  const toImport: QueryObjectImports = returnType.isCollection
    ? QueryObjectImports.CollectionResponseConverterV2
    : returnType.dataType === DataTypes.PrimitiveType
      ? QueryObjectImports.ValueResponseConverterV2
      : returnType.dataType === DataTypes.ComplexType
        ? QueryObjectImports.ComplexResponseConverterV2
        : QueryObjectImports.EntityResponseConverterV2;

  return imports.addQObject(toImport);
}
