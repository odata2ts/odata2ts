import path from "path";

import { ImportDeclarationStructure } from "ts-morph";

import { DataModel } from "../data-model/DataModel";
import { ComplexType, OperationType } from "../data-model/DataTypeModel";

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

  private addGeneratedImport(folderPath: string, fileName: string, names: Array<string>) {
    if (this.isDifferentFile(folderPath, fileName)) {
      const moduleName = this.pathAndFile(folderPath, fileName);
      const imports = this.internalImports.get(moduleName) || new Set<string>();

      names.forEach((n) => imports.add(n));

      this.internalImports.set(moduleName, imports);
    }
  }

  public addGeneratedModel(fqName: string, ...names: Array<string>) {
    if (this.bundledFileNames) {
      this.addGeneratedImport("", this.bundledFileNames.model, names);
    } else {
      const model = this.dataModel.getModel(fqName) || this.dataModel.getUnboundOperationType(fqName);
      if (!model) {
        throw new Error(`Cannot find model by its fully qualified name: ${fqName}!`);
      }
      this.addGeneratedImport(
        model.folderPath,
        (model as ComplexType).modelName || (model as OperationType).paramsModelName,
        names
      );
    }
  }

  public addGeneratedQObject(fqName: string, ...names: Array<string>) {
    if (this.bundledFileNames) {
      this.addGeneratedImport("", this.bundledFileNames.qObject, names);
    } else {
      const model = this.dataModel.getModel(fqName) || this.dataModel.getUnboundOperationType(fqName);
      if (!model) {
        throw new Error(`Cannot find q-object by its fully qualified name: ${fqName}!`);
      }
      this.addGeneratedImport(model.folderPath, (model as ComplexType).qName, names);
    }
  }

  public addGeneratedService(fqName: string, ...names: Array<string>) {
    if (this.bundledFileNames) {
      this.addGeneratedImport("", this.bundledFileNames.service, names);
    } else {
      const model = this.dataModel.getModel(fqName) as ComplexType;
      this.addGeneratedImport(model.folderPath, model.serviceName, names);
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
