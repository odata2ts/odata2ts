import path from "path";

import { ODataVersions } from "@odata2ts/odata-core";
import { ImportDeclarationStructure, OptionalKind } from "ts-morph";

import { DataModel } from "../data-model/DataModel";
import { ComplexType } from "../data-model/DataTypeModel";
import {
  ClientApiImports,
  CoreImports,
  LIB_MODULES,
  QueryObjectImports,
  ServiceImports,
  VERSIONED_CORE_IMPORTS,
  VERSIONED_SERVICE_IMPORTS,
} from "./import/ImportObjects";
import { ImportedNameValidator } from "./ImportedNameValidator";

type ImportContainerType = Record<
  keyof typeof LIB_MODULES,
  { regular: Map<string, string>; typeOnly: Map<string, string> }
>;

/**
 * Handles all the import statements for a given file.
 *
 * Features a renaming mechanism, so that when the import name conflicts with an existing import a new
 * name is generated and returned.
 *
 * Map<string,string>
 */
export class ImportContainer {
  private readonly importedNameValidator: ImportedNameValidator;
  // mapping of a custom defined type to a primitive type
  private customTypes = {
    regular: new Map<string, Map<string, string>>(),
    typeOnly: new Map<string, Map<string, string>>(),
  };
  // imports to generated artefacts
  private internalImports = {
    regular: new Map<string, Map<string, string>>(),
    typeOnly: new Map<string, Map<string, string>>(),
  };

  private libs: ImportContainerType = {
    core: { regular: new Map(), typeOnly: new Map() },
    qObject: { regular: new Map(), typeOnly: new Map() },
    clientApi: { regular: new Map(), typeOnly: new Map() },
    service: { regular: new Map(), typeOnly: new Map() },
  };

  constructor(
    protected path: string,
    protected fileName: string,
    protected dataModel: DataModel,
    protected mainFileNames: { model: string; qObject: string; service: string },
    protected readonly bundledFileGeneration: boolean,
    protected reservedNames: Array<string> | undefined
  ) {
    this.importedNameValidator = new ImportedNameValidator(reservedNames);
  }

  public addCoreLib(odataVersion: ODataVersions, coreLib: CoreImports) {
    const isVersioned = VERSIONED_CORE_IMPORTS.includes(coreLib);
    const name = CoreImports[coreLib] + (isVersioned ? ODataVersions[odataVersion] : "");
    const importName = this.importedNameValidator.validateName(LIB_MODULES.core, name);

    // TODO: currently only types are imported, however enums could potentially be imported too
    this.libs.core.typeOnly.set(name, importName);

    return importName;
  }

  private addFromQObject(name: string, typeOnlyImport = false) {
    const importName = this.importedNameValidator.validateName(LIB_MODULES.qObject, name);

    const imports = typeOnlyImport ? this.libs.qObject.typeOnly : this.libs.qObject.regular;
    imports.set(name, importName);

    return importName;
  }

  public addQObject(qObject: QueryObjectImports | string) {
    return this.addFromQObject(qObject);
  }

  public addQObjectType(qObject: string) {
    return this.addFromQObject(qObject, true);
  }

  public addClientApi(clientApi: ClientApiImports) {
    const name = ClientApiImports[clientApi];
    const importName = this.importedNameValidator.validateName(LIB_MODULES.clientApi, name);

    // complete client api consists only of types
    this.libs.clientApi.typeOnly.set(name, importName);
    return importName;
  }

  public addServiceObject(odataVersion: ODataVersions, serviceObject: ServiceImports) {
    const isVersioned = VERSIONED_SERVICE_IMPORTS.includes(serviceObject);
    const name = ServiceImports[serviceObject] + (isVersioned ? ODataVersions[odataVersion] : "");
    const importName = this.importedNameValidator.validateName(LIB_MODULES.service, name);

    // only regular imports for the service package
    this.libs.service.regular.set(name, importName);
    return importName;
  }

  public addCustomType(moduleName: string, typeName: string, isTypeOnly: boolean = false) {
    const importName = this.importedNameValidator.validateName(moduleName, typeName);
    const imports = isTypeOnly ? this.customTypes.typeOnly : this.customTypes.regular;
    let importList = imports.get(moduleName);
    if (!importList) {
      importList = new Map();
      imports.set(moduleName, importList);
    }

    importList.set(typeName, importName);
    return importName;
  }

  private pathAndFile(filePath: string, fileName: string) {
    return filePath ? `${filePath}/${fileName}` : fileName;
  }

  private isDifferentFile(filePath: string, fileName: string) {
    return this.pathAndFile(this.path, this.fileName) !== this.pathAndFile(filePath, fileName);
  }

  private addGeneratedImport(folderPath: string, fileName: string, name: string, isTypeOnly = false): string {
    // imports are only relevant for different files
    if (!this.isDifferentFile(folderPath, fileName)) {
      return name;
    }

    const moduleName = this.pathAndFile(folderPath, fileName);
    const importName = this.importedNameValidator.validateName(moduleName, name);
    const imports = isTypeOnly ? this.internalImports.typeOnly : this.internalImports.regular;

    const importList = imports.get(moduleName) || new Map<string, string>();
    importList.set(name, importName);
    imports.set(moduleName, importList);

    return importName;
  }

  public addGeneratedModel(fqName: string, name: string): string {
    if (this.bundledFileGeneration) {
      return this.addGeneratedImport("", this.mainFileNames.model, name, true);
    } else {
      const model = this.dataModel.getModel(fqName) as ComplexType | undefined;
      if (!model && fqName !== "") {
        throw new Error(`Cannot find model by its fully qualified name: ${fqName}!`);
      }

      const folderPath = model ? model.folderPath : "";
      const modelName = model ? model.modelName : this.mainFileNames.model;
      return this.addGeneratedImport(folderPath, modelName, name, true);
    }
  }

  public addGeneratedQObject(fqName: string, name: string, isTypeOnly = false) {
    if (this.bundledFileGeneration) {
      return this.addGeneratedImport("", this.mainFileNames.qObject, name, isTypeOnly);
    } else {
      const model = this.dataModel.getModel(fqName) as ComplexType | undefined;
      if (!model && fqName !== "") {
        throw new Error(`Cannot find q-object by its fully qualified name: ${fqName}!`);
      }

      const folderPath = model ? model.folderPath : "";
      const qName = model ? model.qName : this.mainFileNames!.qObject;
      return this.addGeneratedImport(folderPath, qName, name, isTypeOnly);
    }
  }

  public addGeneratedService(fqName: string, name: string) {
    if (this.bundledFileGeneration) {
      return this.addGeneratedImport("", this.mainFileNames.service, name);
    } else {
      const model = this.dataModel.getModel(fqName) as ComplexType;
      return this.addGeneratedImport(model.folderPath, model.serviceName, name);
    }
  }

  private createImportDecl(
    module: string,
    toImport: Map<string, string>,
    isTypeOnly = false
  ): OptionalKind<ImportDeclarationStructure> {
    return {
      namedImports: this.getNamedImports(toImport),
      moduleSpecifier: module,
      isTypeOnly,
    };
  }

  public getImportDeclarations(): Array<OptionalKind<ImportDeclarationStructure>> {
    return [
      ...Object.entries(this.libs).reduce<Array<OptionalKind<ImportDeclarationStructure>>>(
        (result, [moduleName, toImport]) => {
          const module = LIB_MODULES[moduleName as keyof typeof LIB_MODULES];
          if (toImport.typeOnly.size) {
            result.push(this.createImportDecl(module, toImport.typeOnly, true));
          }
          if (toImport.regular.size) {
            result.push(this.createImportDecl(module, toImport.regular));
          }
          return result;
        },
        []
      ),
      ...[...this.customTypes.typeOnly]
        .filter(([moduleName, toImport]) => toImport.size > 0)
        .map(([moduleName, toImport]) => {
          return this.createImportDecl(moduleName, toImport, true);
        }),
      ...[...this.customTypes.regular]
        .filter(([moduleName, toImport]) => toImport.size > 0)
        .map(([moduleName, toImport]) => {
          return this.createImportDecl(moduleName, toImport);
        }),
      ...[...this.internalImports.typeOnly]
        .filter(([_, toImport]) => toImport.size > 0)
        .map(([key, toImport]) => {
          const module = this.getModuleSpecifier(key);
          return this.createImportDecl(module, toImport, true);
        }),
      ...[...this.internalImports.regular]
        .filter(([_, toImport]) => toImport.size > 0)
        .map(([key, toImport]) => {
          const module = this.getModuleSpecifier(key);
          return this.createImportDecl(module, toImport);
        }),
    ];
  }

  private getNamedImports(toImport: Map<string, string>): Array<{ name: string; alias: string | undefined }> {
    return [...toImport.entries()].map(([name, alias]) => ({
      name,
      alias: alias !== name ? alias : undefined,
    }));
  }

  private getModuleSpecifier(filePath: string): string {
    const relativePath = path.relative(this.path, filePath).replaceAll(path.sep, "/");
    return !relativePath.startsWith(".") ? "./" + relativePath : relativePath;
  }
}
