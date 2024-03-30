import path from "path";

import { ImportDeclarationStructure } from "ts-morph";

import { DataModel } from "../data-model/DataModel";
import { ComplexType, OperationType } from "../data-model/DataTypeModel";
import { ImportedNameValidator } from "./ImportedNameValidator";

type ImportContainerType = {
  core: Set<string>;
  qobjects: Set<string>;
  clientApi: Set<string>;
  service: Set<string>;
  customTypes: Map<string, Set<string>>;
};

export class ImportContainer {
  private mapping: {
    [K in keyof ImportContainerType as string]: { moduleName: string; isRelative: boolean; addName?: boolean };
  } = {
    core: { moduleName: "@odata2ts/odata-core", isRelative: false },
    qobjects: { moduleName: "@odata2ts/odata-query-objects", isRelative: false },
    clientApi: { moduleName: "@odata2ts/http-client-api", isRelative: false },
    service: { moduleName: "@odata2ts/odata-service", isRelative: false },
  };

  private container: ImportContainerType = {
    core: new Set(),
    qobjects: new Set(),
    clientApi: new Set(),
    service: new Set(),
    customTypes: new Map(),
  };

  private internalImports = new Map<string, Set<string>>();
  private bundledFileGeneration: boolean;
  private importedNameValidator = new ImportedNameValidator();

  constructor(
    protected path: string,
    protected fileName: string,
    protected dataModel: DataModel,
    private readonly bundledFileNames: { model: string; qObject: string; service: string } | undefined
  ) {
    this.bundledFileGeneration = this.bundledFileNames !== undefined;
  }

  public addFromCore(...names: Array<string>) {
    names.forEach((n) => this.container.core.add(n));
  }

  public addFromQObject(...names: Array<string>) {
    names.forEach((n) => this.container.qobjects.add(n));
  }

  public addFromClientApi(...names: Array<string>) {
    names.forEach((n) => this.container.clientApi.add(n));
  }

  public addFromService(...names: Array<string>) {
    names.forEach((n) => this.container.service.add(n));
  }

  public addCustomType(moduleName: string, typeName: string) {
    let importList = this.container.customTypes.get(moduleName);
    if (!importList) {
      importList = new Set();
      this.container.customTypes.set(moduleName, importList);
    }
    importList.add(typeName);
  }

  private pathAndFile(filePath: string, fileName: string) {
    return filePath ? `${filePath}/${fileName}` : fileName;
  }

  private isDifferentFile(filePath: string, fileName: string) {
    return this.pathAndFile(this.path, this.fileName) !== this.pathAndFile(filePath, fileName);
  }

  private addGeneratedImport(folderPath: string, fileName: string, name: string): string {
    if (this.isDifferentFile(folderPath, fileName)) {
      const moduleName = this.pathAndFile(folderPath, fileName);
      const importName = this.importedNameValidator.validateName(moduleName, name);
      const imports = this.internalImports.get(moduleName) || new Set<string>();

      imports.add(importName);

      this.internalImports.set(moduleName, imports);
      return importName;
    }
    return name;
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
    const { customTypes, ...standardImports } = this.container;

    return [
      ...[...customTypes.keys()]
        .filter((key) => !!customTypes.get(key)?.size)
        .map((key) => {
          return {
            namedImports: [...customTypes.get(key)!],
            moduleSpecifier: key,
          } as ImportDeclarationStructure;
        }),
      ...Object.entries(standardImports)
        .filter(([_, values]) => !!values.size)
        .map(([key, values]) => {
          const mapping = this.mapping[key];
          return {
            namedImports: [...values],
            moduleSpecifier: `${mapping.isRelative ? `${fromSubPath ? ".." : "."}/` : ""}${mapping.moduleName}`,
          } as ImportDeclarationStructure;
        }),
      ...[...this.internalImports.entries()]
        .filter(([_, values]) => values.size > 0)
        .map(([key, values]) => {
          return {
            namedImports: [...values],
            moduleSpecifier: this.getModuleSpecifier(key),
          } as ImportDeclarationStructure;
        }),
    ];
  }

  private getModuleSpecifier(filePath: string): string {
    const relativePath = path.relative(this.path, filePath).replaceAll(path.sep, "/");
    return !relativePath.startsWith(".") ? "./" + relativePath : relativePath;
  }
}
