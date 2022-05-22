import { ImportDeclarationStructure } from "ts-morph";

type ImportContainerType = {
  clientApi: Set<string>;
  service: Set<string>;
};

export class ModelImportContainer {
  private mapping: {
    [K in keyof ImportContainerType as string]: { moduleName: string; isRelative: boolean; addName?: boolean };
  } = {
    clientApi: { moduleName: "@odata2ts/odata-client-api", isRelative: false },
    service: { moduleName: "@odata2ts/odata-service", isRelative: false },
  };

  private container: ImportContainerType = {
    clientApi: new Set(),
    service: new Set(),
  };

  public addFromClientApi(...names: Array<string>) {
    names.forEach((n) => this.container.clientApi.add(n));
  }

  public addFromService(...names: Array<string>) {
    names.forEach((n) => this.container.service.add(n));
  }

  public getImportDeclarations(fromSubPath: boolean = false): Array<ImportDeclarationStructure> {
    const { ...standardImports } = this.container;

    return [
      ...Object.entries(standardImports)
        .filter(([key, values]) => !!values.size)
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
