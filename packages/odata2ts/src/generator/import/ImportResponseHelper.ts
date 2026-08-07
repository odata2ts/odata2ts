import { ODataVersions } from "@odata2ts/odata-core";
import { DataTypes, ReturnTypeModel } from "../../data-model/DataTypeModel.js";
import { ImportContainer } from "../ImportContainer.js";
import { CoreImports, QueryObjectImports } from "./ImportObjects.js";

export function importReturnType(
  version: ODataVersions,
  imports: ImportContainer,
  returnType: ReturnTypeModel,
  asV4 = false,
): string {
  // the V4 response shape is identical whether it actually came from a V4 service or was reshaped from V2,
  // so a V2 service opting into v2ResponseAsV4 simply takes the V4 branch
  const effectiveVersion = asV4 && version === ODataVersions.V2 ? ODataVersions.V4 : version;

  const typeToImport: CoreImports | undefined = returnType.isCollection
    ? CoreImports.ODataCollectionResponse
    : returnType.dataType === DataTypes.PrimitiveType
      ? CoreImports.ODataValueResponse
      : undefined;

  if (typeToImport) {
    return imports.addCoreLib(effectiveVersion, typeToImport);
  }

  return effectiveVersion === ODataVersions.V2 ? importReturnTypeV2(imports, returnType) : importReturnTypeV4(imports);
}

function importReturnTypeV4(imports: ImportContainer) {
  return imports.addCoreLib(
    ODataVersions.V4,
    imports.isV401() ? CoreImports.ODataModelResponseV401 : CoreImports.ODataModelResponseV4,
  );
}

function importReturnTypeV2(imports: ImportContainer, returnType: ReturnTypeModel) {
  return imports.addCoreLib(
    ODataVersions.V2,
    returnType.dataType === DataTypes.ComplexType
      ? CoreImports.ODataComplexModelResponseV2
      : CoreImports.ODataEntityModelResponseV2,
  );
}

/**
 * The main response converter class for an operation's return type. The very same class serves a plain V2
 * response and one reshaped as V4 (see {@link CollectionResponseConverterV2} & co.) - which of the two a
 * given instance produces is a constructor argument, not a different import, so this needs no `asV4` flag
 * unlike {@link importReturnType}: the caller appends the literal `true` to the constructor call itself
 * where the operation's owning service was generated with `v2ResponseAsV4`.
 */
export function importMainResponseConverter(version: ODataVersions, imports: ImportContainer, returnType: ReturnTypeModel) {
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
