import { ImportDeclarationStructure } from "ts-morph";

import { ProjectFiles } from "../data-model/DataModel";

type ImportContainerType = {
  core: Set<string>;
  qobjects: Set<string>;
  clientApi: Set<string>;
  service: Set<string>;
  genModel: Set<string>;
  genQObjects: Set<string>;
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
    genModel: { moduleName: "", isRelative: true },
    genQObjects: { moduleName: "", isRelative: true },
  };

  private container: ImportContainerType = {
    core: new Set(),
    qobjects: new Set(),
    clientApi: new Set(),
    service: new Set(),
    genModel: new Set(),
    genQObjects: new Set(),
    customTypes: new Map(),
  };

  constructor(fileNames: ProjectFiles) {
    this.mapping.genModel.moduleName = fileNames.model;
    this.mapping.genQObjects.moduleName = fileNames.qObject;
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

  public addGeneratedModel(...names: Array<string>) {
    names.forEach((n) => this.container.genModel.add(n));
  }

  public addGeneratedQObject(...names: Array<string>) {
    names.forEach((n) => this.container.genQObjects.add(n));
  }

  public addCustomType(moduleName: string, typeName: string) {
    let importList = this.container.customTypes.get(moduleName);
    if (!importList) {
      importList = new Set();
      this.container.customTypes.set(moduleName, importList);
    }
    importList.add(typeName);
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
    ];
  }
}
