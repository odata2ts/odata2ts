import { MethodDeclarationStructure, OptionalKind, Scope, SourceFile } from "ts-morph";

import { DataModel } from "./../data-model/DataModel";
import { TsGenerator } from "./GeneratorModel";
import { ModelTypes } from "../data-model/DataTypeModel";

const ROOT_SERVICE = "ODataService";
const RESPONSE_TYPES = {
  collection: "ODataCollectionResponse",
  model: "ODataModelResponse",
  value: "ODataValueResponse",
};

export class ServiceGenerator implements TsGenerator {
  public generate(dataModel: DataModel, sourceFile: SourceFile): void {
    const serviceName = dataModel.getFileNames().service;
    const container = dataModel.getEntityContainer();

    const serviceImports: Set<string> = new Set([ROOT_SERVICE]);
    const modelImports: Set<string> = new Set();
    const qImports: Set<string> = new Set();
    const clientApiImports: Set<string> = new Set(["ODataClient", "ODataResponse"]);

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
        { scope: Scope.Private, name: "name", type: "string", initializer: `"${dataModel.getServiceName()}"` },
        ...Object.values(container.entitySets).map(({ name, entityType }) => {
          const isEntity = entityType.modelType === ModelTypes.EntityType;
          const serviceType = isEntity ? "EntitySetService" : "CollectionService";
          const type = `${serviceType}<${entityType.name}${
            isEntity ? `, ${entityType.keys.map((k) => `"${k}"`).join("|")}` : ""
          }>`;

          serviceImports.add(serviceType);
          modelImports.add(entityType.name);
          qImports.add(entityType.qName);

          return {
            scope: Scope.Public,
            name,
            type,
          };
        }),
      ],
      methods: [
        ...Object.values(container.functions).map(
          ({ name, odataName, operation }): OptionalKind<MethodDeclarationStructure> => {
            const returnType = operation.returnType ? operation.returnType.type : "void";

            clientApiImports.add(RESPONSE_TYPES.model);

            return {
              scope: Scope.Public,
              name,
              parameters: operation.parameters.map((param) => ({
                name: param.name,
                type: param.type, // todo collection types
              })),
              returnType: `ODataResponse<${RESPONSE_TYPES.model}<${returnType}>>`,
              statements: `return this.client.get(this.getPath() + "/${odataName}");`,
            };
          }
        ),
      ],
    });

    sourceFile.addImportDeclarations([
      {
        namedImports: [...serviceImports],
        moduleSpecifier: "@odata2ts/odata-service",
      },
      {
        namedImports: [...clientApiImports],
        moduleSpecifier: "@odata2ts/odata-client-api",
      },
      {
        namedImports: [...modelImports],
        moduleSpecifier: "./" + dataModel.getFileNames().model,
      },
      {
        namedImports: [...qImports],
        moduleSpecifier: "./" + dataModel.getFileNames().qObject,
      },
    ]);
  }
}
