import path from "path";

import { ODataVersions } from "@odata2ts/odata-core";
import { ImportDeclarationStructure } from "ts-morph";

import { DataModel } from "../data-model/DataModel";
import { ComplexType, OperationType } from "../data-model/DataTypeModel";
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

type ImportContainerType = Record<keyof typeof LIB_MODULES, Map<string, string>>;

/**
 * Handles all the import statements for a given file.
 *
 * Features a renaming mechanism, so that when the import name conflicts with an existing import a new
 * name is generated and returned.
 *
 * Map<string,string>
 */
export class ImportContainer {
  private readonly bundledFileGeneration: boolean;
  private readonly importedNameValidator: ImportedNameValidator;
  // mapping of a custom defined type to a primitive type
  private customTypes = new Map<string, Map<string, string>>();
  // imports to generated artefacts
  private internalImports = new Map<string, Map<string, string>>();

  private libs: ImportContainerType = {
    core: new Map(),
    qObject: new Map(),
    clientApi: new Map(),
    service: new Map(),
  };

  constructor(
    protected path: string,
    protected fileName: string,
    protected dataModel: DataModel,
    protected reservedNames: Array<string> | undefined,
    protected readonly bundledFileNames: { model: string; qObject: string; service: string } | undefined
  ) {
    this.bundledFileGeneration = this.bundledFileNames !== undefined;
    this.importedNameValidator = new ImportedNameValidator(reservedNames);
  }

  public addCoreLib(odataVersion: ODataVersions, ...coreLibs: Array<CoreImports>) {
    return coreLibs.map((coreLib) => {
      const name = CoreImports[coreLib] + (VERSIONED_CORE_IMPORTS.includes(coreLib) ? ODataVersions[odataVersion] : "");
      const importName = this.importedNameValidator.validateName(LIB_MODULES.core, name);
      this.libs.core.set(name, importName);
      return importName;
    });
  }

  public addFromQObject(...names: Array<string>) {
    return names.map((n) => {
      const importName = this.importedNameValidator.validateName(LIB_MODULES.qObject, n);
      this.libs.qObject.set(n, importName);
      return importName;
    });
  }

  public addQObject(...qObjects: Array<QueryObjectImports>) {
    return this.addFromQObject(...qObjects.map((qObject) => QueryObjectImports[qObject]));
  }

  public addClientApi(...clientApis: Array<ClientApiImports>) {
    return clientApis.map((clientApi) => {
      const name = ClientApiImports[clientApi];
      const importName = this.importedNameValidator.validateName(LIB_MODULES.clientApi, name);
      this.libs.clientApi.set(name, importName);
      return importName;
    });
  }

  public addServiceObject(odataVersion: ODataVersions, ...serviceObjects: Array<ServiceImports>) {
    return serviceObjects
      .map((so) => {
        return ServiceImports[so] + (VERSIONED_SERVICE_IMPORTS.includes(so) ? ODataVersions[odataVersion] : "");
      })
      .map((so) => {
        const importName = this.importedNameValidator.validateName(LIB_MODULES.service, so);
        this.libs.service.set(so, importName);
        return importName;
      });
  }

  public addCustomType(moduleName: string, typeName: string) {
    let importList = this.customTypes.get(moduleName);
    if (!importList) {
      importList = new Map();
      this.customTypes.set(moduleName, importList);
    }

    const importName = this.importedNameValidator.validateName(moduleName, typeName);
    importList.set(typeName, importName);
    return importName;
  }

  private pathAndFile(filePath: string, fileName: string) {
    return filePath ? `${filePath}/${fileName}` : fileName;
  }

  private isDifferentFile(filePath: string, fileName: string) {
    return this.pathAndFile(this.path, this.fileName) !== this.pathAndFile(filePath, fileName);
  }

  private addGeneratedImport(folderPath: string, fileName: string, name: string): string {
    // imports are only relevant for different files
    if (!this.isDifferentFile(folderPath, fileName)) {
      return name;
    }

    const moduleName = this.pathAndFile(folderPath, fileName);
    const importName = this.importedNameValidator.validateName(moduleName, name);

    const imports = this.internalImports.get(moduleName) || new Map<string, string>();
    imports.set(name, importName);
    this.internalImports.set(moduleName, imports);

    return importName;
  }

  public addGeneratedModel(fqName: string, name: string): string {
    if (this.bundledFileNames) {
      return this.addGeneratedImport("", this.bundledFileNames.model, name);
    } else {
      const model = this.dataModel.getModel(fqName) || this.dataModel.getUnboundOperationType(fqName);
      if (!model) {
        throw new Error(`Cannot find model by its fully qualified name: ${fqName}!`);
      }
      return this.addGeneratedImport(
        model.folderPath,
        (model as ComplexType).modelName || (model as OperationType).paramsModelName,
        name
      );
    }
  }

  public addGeneratedQObject(fqName: string, name: string) {
    if (this.bundledFileNames) {
      return this.addGeneratedImport("", this.bundledFileNames.qObject, name);
    } else {
      const model = this.dataModel.getModel(fqName) || this.dataModel.getUnboundOperationType(fqName);
      if (!model) {
        throw new Error(`Cannot find q-object by its fully qualified name: ${fqName}!`);
      }
      return this.addGeneratedImport(model.folderPath, (model as ComplexType).qName, name);
    }
  }

  public addGeneratedService(fqName: string, name: string) {
    if (this.bundledFileNames) {
      return this.addGeneratedImport("", this.bundledFileNames.service, name);
    } else {
      const model = this.dataModel.getModel(fqName) as ComplexType;
      return this.addGeneratedImport(model.folderPath, model.serviceName, name);
    }
  }

  public getImportDeclarations(fromSubPath: boolean = false): Array<ImportDeclarationStructure> {
    return [
      ...Object.entries(this.libs)
        .filter(([_, values]) => !!values.size)
        .map(([moduleName, toImport]) => {
          return {
            namedImports: this.getNamedImports(toImport),
            moduleSpecifier: LIB_MODULES[moduleName],
          } as ImportDeclarationStructure;
        }),
      ...[...this.customTypes.keys()]
        .filter((moduleName) => !!this.customTypes.get(moduleName)?.size)
        .map((moduleName) => {
          const toImport = this.customTypes.get(moduleName)!;
          return {
            namedImports: this.getNamedImports(toImport),
            moduleSpecifier: moduleName,
          } as ImportDeclarationStructure;
        }),
      ...[...this.internalImports.entries()]
        .filter(([_, toImport]) => toImport.size > 0)
        .map(([key, toImport]) => {
          return {
            namedImports: this.getNamedImports(toImport),
            moduleSpecifier: this.getModuleSpecifier(key),
          } as ImportDeclarationStructure;
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
