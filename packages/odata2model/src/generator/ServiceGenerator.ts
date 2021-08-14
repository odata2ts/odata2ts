import { compileParameterPath } from "@odata2ts/odata-service";
import { ImportContainer } from "./ImportContainer";
import { upperCaseFirst } from "upper-case-first";
import { PropertyModel } from "./../data-model/DataTypeModel";
import { ProjectManager } from "./../project/ProjectManager";
import {
  ImportDeclarationStructure,
  MethodDeclarationStructure,
  OptionalKind,
  PropertyDeclarationStructure,
  Scope,
} from "ts-morph";

import { DataModel } from "./../data-model/DataModel";
import {
  ActionImportType,
  DataTypes,
  FunctionImportType,
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

export class ServiceGenerator {
  constructor(private project: ProjectManager, private dataModel: DataModel) {}

  public async generate(): Promise<void> {
    const sourceFile = await this.project.createMainServiceFile();
    const serviceName = this.dataModel.getFileNames().service;
    const container = this.dataModel.getEntityContainer();

    await this.generateModelServices();

    const importContainer = new ImportContainer(this.dataModel);
    importContainer.addFromClientApi("ODataClient", "ODataResponse");
    importContainer.addFromService(ROOT_SERVICE, URL_COMPILER, BODY_PARAM_COMPILER);

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

          importContainer.addFromService(serviceType);
          importContainer.addGeneratedModel(entityType.name);
          importContainer.addGeneratedQObject(entityType.qName);

          return {
            scope: Scope.Public,
            name,
            type,
          };
        }),
      ],
      methods: [
        ...this.generateMethods(Object.values(container.functions), OperationTypes.Function, importContainer),
        ...this.generateMethods(Object.values(container.actions), OperationTypes.Action, importContainer),
      ],
    });

    sourceFile.addImportDeclarations(importContainer.getImportDeclarations());
  }

  private async generateModelServices() {
    const entityServiceType = "EntityTypeService";
    const entitySetServiceType = "EntitySetService";
    const collectionServiceType = "CollectionService";

    // build service file for each entity & complex type
    // also include a corresponding CollectionService for each type
    for (const model of this.dataModel.getModels()) {
      const serviceName = this.getServiceName(model.name);
      const serviceFile = await this.project.createServiceFile(serviceName);
      const props = [...model.baseProps, ...model.props];
      const modelProps = props.filter((prop) => prop.dataType === DataTypes.ModelType);
      const importContainer = new ImportContainer(this.dataModel);

      importContainer.addFromService(entityServiceType);
      importContainer.addFromClientApi("ODataClient");
      importContainer.addGeneratedModel(model.name);
      importContainer.addGeneratedQObject(model.qName);

      // generate EntityTypeService
      serviceFile.addClass({
        isExported: true,
        name: serviceName,
        extends: entityServiceType + `<${model.name}>`,
        ctors: [
          {
            parameters: [
              { name: "client", type: "ODataClient" },
              { name: "path", type: "string" },
            ],
            statements: [
              `super(client, path, ${model.qName});`,
              /* ...Object.values(container.entitySets).map(({ name, entityType }) => {
              return `this.${name} = new EntitySetService(this.client, this.getPath(), ${entityType.qName})`;
            }), */
            ],
          },
        ],
        properties: [
          ...modelProps.map((prop) => {
            const [key, propModelType] = this.getServiceNamesForProp(prop);
            // don't include imports for this type
            if (serviceName !== key) {
              importContainer.addGeneratedService(key, propModelType);
            }

            return {
              scope: Scope.Private,
              name: prop.name,
              type: `${propModelType} | undefined `,
            } as PropertyDeclarationStructure;
          }),
        ],
        methods: [
          ...modelProps.map(
            (prop) =>
              ({
                scope: Scope.Public,
                name: `get${upperCaseFirst(prop.name)}`,
                returnType: this.getServiceNameForProp(prop),
                statements: [
                  `if(!this.${prop.name}) {`,
                  // prettier-ignore
                  `  this.${prop.name} = new ${this.getServiceNameForProp(prop)}(this.client, this.path + "/${prop.odataName}")`,
                  "}",
                  `return this.${prop.name}`,
                ],
              } as MethodDeclarationStructure)
          ),
        ],
      });

      if (model.modelType === ModelTypes.EntityType) {
        importContainer.addFromService(entitySetServiceType);

        // now the entity collection service
        serviceFile.addClass({
          isExported: true,
          name: this.getCollectionServiceName(model.name),
          extends: entitySetServiceType + `<${model.name}, >`,
          ctors: [
            {
              parameters: [
                { name: "client", type: "ODataClient" },
                { name: "path", type: "string" },
              ],
              statements: [
                `super(client, path, ${model.qName});`,
                /* ...Object.values(container.entitySets).map(({ name, entityType }) => {
              return `this.${name} = new EntitySetService(this.client, this.getPath(), ${entityType.qName})`;
            }), */
              ],
            },
          ],
          methods: [],
        });
      }

      serviceFile.addImportDeclarations(importContainer.getImportDeclarations(true));
    }
  }

  private getServiceName(name: string) {
    return name + "Service";
  }

  private getCollectionServiceName(name: string) {
    return name + "CollectionService";
  }

  private getServiceNamesForProp(prop: PropertyModel): [string, string] {
    const serviceName = this.getServiceName(prop.type);
    return [serviceName, prop.isCollection ? this.getCollectionServiceName(prop.type) : serviceName];
  }

  private getServiceNameForProp(prop: PropertyModel): string {
    return this.getServiceNamesForProp(prop)[1];
  }

  private generateMethods(
    operations: Array<FunctionImportType | ActionImportType>,
    operationType: OperationTypes,
    importContainer: ImportContainer
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

      importContainer.addFromClientApi(RESPONSE_TYPES.model);

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
