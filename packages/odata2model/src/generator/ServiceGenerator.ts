import { ProjectManager } from "./../project/ProjectManager";
import {
  ClassDeclarationStructure,
  MethodDeclarationStructure,
  OptionalKind,
  Project,
  Scope,
  SourceFile,
} from "ts-morph";

import { DataModel } from "./../data-model/DataModel";
import {
  ActionImportType,
  DataTypes,
  FunctionImportType,
  ModelType,
  ModelTypes,
  OperationTypes,
} from "../data-model/DataTypeModel";

const ROOT_SERVICE = "ODataService";
const URL_COMPILER = "compileParameterPath";
const BODY_PARAM_COMPILER = "compileBodyParam";
const RESPONSE_TYPES = {
  collection: "ODataCollectionResponse",
  model: "ODataModelResponse",
  value: "ODataValueResponse",
};

type ImportContainer = {
  service: Set<string>;
  model: Set<string>;
  qobjects: Set<string>;
  clientApi: Set<string>;
};

export class ServiceGenerator {
  constructor(private project: ProjectManager, private dataModel: DataModel) {}

  private createImportContainer(): ImportContainer {
    return {
      service: new Set(),
      model: new Set(),
      qobjects: new Set(),
      clientApi: new Set(["ODataClient", "ODataResponse"]),
    };
  }

  public generate(): void {
    const sourceFile = this.project.getMainServiceFile();
    const serviceName = this.dataModel.getFileNames().service;
    const container = this.dataModel.getEntityContainer();
    const fileNames = this.dataModel.getFileNames();

    const importContainer = this.createImportContainer();
    importContainer.service.add(ROOT_SERVICE);
    importContainer.service.add(URL_COMPILER);
    importContainer.service.add(BODY_PARAM_COMPILER);

    sourceFile.addClass({
      isExported: true,
      name: serviceName,
      extends: ROOT_SERVICE,
      ctors: [
        {
          parameters: [
            { name: "client", type: "ODataClient<any>" },
            { name: "basePath", type: "string" },
          ],
          statements: [
            "super(client, basePath);",
            ...Object.values(container.entitySets).map(({ name, entityType }) => {
              return `this.${name} = new EntitySetService(this.client, this.getPath(), ${entityType.qName})`;
            }),
          ],
        },
      ],
      properties: [
        // the name of the service is part of any URL: basePath/name/*
        { scope: Scope.Private, name: "name", type: "string", initializer: `"${this.dataModel.getServiceName()}"` },
        ...Object.values(container.entitySets).map(({ name, entityType }) => {
          const isEntity = entityType.modelType === ModelTypes.EntityType;
          const serviceType = isEntity ? "EntitySetService" : "CollectionService";
          const type = `${serviceType}<${entityType.name}${
            isEntity ? `, ${entityType.keys.map((k) => `"${k}"`).join("|")}` : ""
          }>`;

          importContainer.service.add(serviceType);
          importContainer.model.add(entityType.name);
          importContainer.qobjects.add(entityType.qName);

          return {
            scope: Scope.Public,
            name,
            type,
          };
        }),
      ],
      methods: [
        ...this.generateMethods(Object.values(container.functions), OperationTypes.Function, importContainer.clientApi),
        ...this.generateMethods(Object.values(container.actions), OperationTypes.Action, importContainer.clientApi),
      ],
    });

    sourceFile.addImportDeclarations([
      {
        namedImports: [...importContainer.service],
        moduleSpecifier: "@odata2ts/odata-service",
      },
      {
        namedImports: [...importContainer.clientApi],
        moduleSpecifier: "@odata2ts/odata-client-api",
      },
      {
        namedImports: [...importContainer.model],
        moduleSpecifier: "./" + fileNames.model,
      },
      {
        namedImports: [...importContainer.qobjects],
        moduleSpecifier: "./" + fileNames.qObject,
      },
    ]);
  }

  private generateModelServices(importContainer: ImportContainer) {
    this.dataModel.getModels().forEach((model) => {
      const serviceType = "EntityTypeService";

      importContainer.service.add(serviceType);
      importContainer.qobjects.add(model.qName);

      // [model.name]
      const result = {
        isExported: true,
        name: this.getServiceName(model),
        extends: serviceType + `<${model.name}>`,
        ctors: [
          {
            parameters: [
              { name: "client", type: "ODataClient" },
              { name: "path", type: "string" },
              { name: "qModel", type: `QEntityModel<${model.name}>` },
            ],
            statements: [
              "super(client, path, qModel);",
              /* ...Object.values(container.entitySets).map(({ name, entityType }) => {
              return `this.${name} = new EntitySetService(this.client, this.getPath(), ${entityType.qName})`;
            }), */
            ],
          },
        ],
        properties: [
          {
            scope: Scope.Private,
            name: "qObject",
            initializer: model.qName,
          },
        ],
      };
    });
  }

  private getServiceName(model: ModelType) {
    return model.name + "Service";
  }

  private generateMethods(
    operations: Array<FunctionImportType | ActionImportType>,
    operationType: OperationTypes,
    clientApiImports: Set<string>
  ) {
    return Object.values(operations).map(({ name, odataName, operation }): OptionalKind<MethodDeclarationStructure> => {
      const isFunc = operationType === OperationTypes.Function;
      const returnType = operation.returnType ? operation.returnType.type : "void";
      const paramsSpec = operation.parameters.map((p) => {
        const isLiteral = p.type !== "string" && p.dataType !== DataTypes.EnumType;
        return `${p.name}: { isLiteral: ${isLiteral}, value: ${p.name} }`;
      });
      const paramSpec = paramsSpec.length ? `{ ${paramsSpec.join(", ")} }` : undefined;
      const bodyParamsParam = !isFunc && paramSpec ? `compileBodyParam(${paramSpec})` : "{}";

      clientApiImports.add(RESPONSE_TYPES.model);

      return {
        scope: Scope.Public,
        name,
        parameters: operation.parameters.map((param) => ({
          name: param.name,
          type: param.type, // todo collection types
        })),
        returnType: `ODataResponse<${RESPONSE_TYPES.model}<${returnType}>>`,
        statements: [
          `const url = ${URL_COMPILER}(this.getPath(), "${odataName}"${isFunc && paramSpec ? `, ${paramSpec}` : ""})`,
          `return this.client.${isFunc ? "get(url)" : `post(url, ${bodyParamsParam})`};`,
        ],
      };
    });
  }
}
