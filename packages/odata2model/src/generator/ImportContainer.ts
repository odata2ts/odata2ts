import { ImportDeclarationStructure } from "ts-morph";
import { DataModel } from "../data-model/DataModel";

type ImportContainerType = {
  qobjects: Set<string>;
  clientApi: Set<string>;
  service: Set<string>;
  genModel: Set<string>;
  genQObjects: Set<string>;
  genServices: { [key: string]: Set<string> };
};

export class ImportContainer {
  private mapping: {
    [K in keyof ImportContainerType as string]: { moduleName: string; isRelative: boolean; addName?: boolean };
  } = {
    qobjects: { moduleName: "@odata2ts/odata-query-objects", isRelative: false },
    clientApi: { moduleName: "@odata2ts/odata-client-api", isRelative: false },
    service: { moduleName: "@odata2ts/odata-service", isRelative: false },
    genModel: { moduleName: "", isRelative: true },
    genQObjects: { moduleName: "", isRelative: true },
  };

  private container: ImportContainerType = {
    qobjects: new Set(),
    clientApi: new Set(),
    service: new Set(),
    genModel: new Set(),
    genQObjects: new Set(),
    genServices: {},
  };

  constructor(dataModel: DataModel) {
    const fileNames = dataModel.getFileNames();
    this.mapping.genModel.moduleName = fileNames.model;
    this.mapping.genQObjects.moduleName = fileNames.qObject;
  }

  public addFromQObject(...names: Array<string>) {
    names.forEach(this.container.qobjects.add);
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

  public addGeneratedService(key: string, ...names: Array<string>) {
    let serv = this.container.genServices[key];
    if (!serv) {
      serv = new Set();
      this.container.genServices[key] = serv;
    }
    names.forEach((n) => serv.add(n));
  }

  public getImportDeclarations(fromSubPath: boolean = false): Array<ImportDeclarationStructure> {
    const { genServices, ...standardImports } = this.container;
    const relativePath = `${fromSubPath ? ".." : "."}/`;

    return [
      ...Object.entries(standardImports)
        .filter(([key, values]) => !!values.size)
        .map(([key, values]) => {
          const mapping = this.mapping[key];
          return {
            namedImports: [...values],
            moduleSpecifier: `${mapping.isRelative ? relativePath : ""}${mapping.moduleName}`,
          } as ImportDeclarationStructure;
        }),
      ...Object.entries(genServices).map(([key, values]) => {
        return {
          namedImports: [...values],
          moduleSpecifier: (fromSubPath ? "./" : "../") + key,
        } as ImportDeclarationStructure;
      }),
    ];
  }
}
