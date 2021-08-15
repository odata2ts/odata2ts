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
const COMPILE_PARAMS = "compileParameterPath";
const COMPILE_BODY = "compileBodyParam";
const COMPILE_ID = "compileId";
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
    importContainer.addFromClientApi("ODataClient");
    importContainer.addFromService(ROOT_SERVICE);

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
            ...Object.values(container.entitySets).map(({ name, odataName, entityType }) => {
              const serviceType = this.getCollectionServiceName(entityType.name);
              return `this.${name} = new ${serviceType}(this.client, this.getPath() + "/${odataName}")`;
            }),
          ],
        },
      ],
      properties: [
        // the name of the service is part of any URL: basePath/name/*
        { scope: Scope.Private, name: "name", type: "string", initializer: `"${this.dataModel.getServiceName()}"` },
        ...Object.values(container.entitySets).map(({ name, entityType }) => {
          const type = this.getCollectionServiceName(entityType.name);

          importContainer.addGeneratedService(this.getServiceName(entityType.name), type);

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

    sourceFile.addImportDeclarations(importContainer.getImportDeclarations(false));
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
            const modelType = this.dataModel.getModel(prop.type);
            const isCollection = prop.isCollection && modelType.modelType === ModelTypes.ComplexType;
            let [key, propModelType] = this.getServiceNamesForProp(prop);

            if (isCollection) {
              importContainer.addFromService(collectionServiceType);
              importContainer.addGeneratedModel(modelType.name);
              importContainer.addGeneratedQObject(modelType.qName);
              propModelType = `${collectionServiceType}<${modelType.name}>`;
            }
            // don't include imports for this type
            else if (serviceName !== key) {
              importContainer.addGeneratedService(key, propModelType);
            }

            return {
              scope: Scope.Private,
              name: prop.name,
              type: `${propModelType}`,
              hasQuestionToken: true,
            } as PropertyDeclarationStructure;
          }),
        ],
        methods: [
          ...modelProps.map((prop) => {
            const modelType = this.dataModel.getModel(prop.type);
            const isCollection = prop.isCollection && modelType.modelType === ModelTypes.ComplexType;
            const type = isCollection
              ? `${collectionServiceType}<${modelType.name}>`
              : this.getServiceNameForProp(prop);

            return {
              scope: Scope.Public,
              name: `get${upperCaseFirst(prop.name)}`,
              returnType: type,
              statements: [
                `if(!this.${prop.name}) {`,
                // prettier-ignore
                `  this.${prop.name} = new ${type}(this.client, this.path + "/${prop.odataName}"${isCollection ? `, ${modelType.qName}`: ""})`,
                "}",
                `return this.${prop.name}`,
              ],
            } as MethodDeclarationStructure;
          }),
        ],
      });

      if (model.modelType === ModelTypes.EntityType) {
        importContainer.addFromService(entitySetServiceType, COMPILE_ID);

        const isSingleKey = model.keys.length === 1;
        const keyType = isSingleKey
          ? model.keys[0].type
          : `{ ${model.keys.map((k) => `${k.name}: ${k.type}`).join(", ")} }`;
        const keySpec = this.createKeySpec(model.keys);

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
          properties: [{ name: "keySpec", scope: Scope.Private, initializer: keySpec }],
          methods: [
            {
              name: "getKeySpec",
              scope: Scope.Public,
              statements: ["return this.keySpec"],
            },
            {
              name: "get",
              scope: Scope.Public,
              returnType: serviceName,
              parameters: [{ name: "id", type: keyType }],
              statements: [
                `const url = ${COMPILE_ID}(this.path, this.keySpec, id)`,
                `return new ${serviceName}(this.client, url)`,
              ],
            },
          ],
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

  private isQuotedValue(prop: PropertyModel): boolean {
    return prop.type === "string" || prop.dataType === DataTypes.EnumType;
  }

  private createKeySpec(params: Array<PropertyModel>): string | undefined {
    const props = params.map((p) => `{ isLiteral: ${!this.isQuotedValue(p)}, name: "${p.name}" }`);
    return props.length ? `[${props.join(", ")}]` : undefined;
  }

  private createParamsSpec(params: Array<PropertyModel>): string | undefined {
    const props = params.map((p) => `${p.name}: { isLiteral: ${!this.isQuotedValue(p)}, value: ${p.name} }`);
    return props.length ? `{ ${props.join(", ")} }` : undefined;
  }

  private generateMethods(
    operations: Array<FunctionImportType | ActionImportType>,
    operationType: OperationTypes,
    importContainer: ImportContainer
  ) {
    return Object.values(operations).map(({ name, odataName, operation }): OptionalKind<MethodDeclarationStructure> => {
      const isFunc = operationType === OperationTypes.Function;
      const returnType = operation.returnType ? operation.returnType.type : "void";
      const paramsSpec = this.createParamsSpec(operation.parameters);
      const bodyParamsParam = !isFunc && paramsSpec ? `${COMPILE_BODY}(${paramsSpec})` : "{}";

      importContainer.addFromClientApi("ODataResponse", RESPONSE_TYPES.model);
      importContainer.addFromService(COMPILE_PARAMS);
      if (!isFunc && paramsSpec) {
        importContainer.addFromService(COMPILE_BODY);
      }
      if (operation.returnType?.type) {
        importContainer.addGeneratedModel(returnType);
      }

      return {
        scope: Scope.Public,
        name,
        parameters: operation.parameters.map((param) => ({
          name: param.name,
          type: param.type, // todo collection types
        })),
        returnType: `ODataResponse<${RESPONSE_TYPES.model}<${returnType}>>`,
        statements: [
          // prettier-ignore
          `const url = ${COMPILE_PARAMS}(this.getPath(), "${odataName}"${isFunc && paramsSpec ? `, ${paramsSpec}` : ""})`,
          `return this.client.${isFunc ? "get(url)" : `post(url, ${bodyParamsParam})`};`,
        ],
      };
    });
  }
}
