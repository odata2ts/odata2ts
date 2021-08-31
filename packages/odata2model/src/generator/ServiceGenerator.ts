import { upperCaseFirst } from "upper-case-first";
import {
  GetAccessorDeclarationStructure,
  MethodDeclarationStructure,
  OptionalKind,
  ParameterDeclarationStructure,
  PropertyDeclarationStructure,
  Scope,
} from "ts-morph";

import { ImportContainer } from "./ImportContainer";
import { ProjectManager } from "./../project/ProjectManager";
import { DataModel } from "./../data-model/DataModel";
import {
  ActionImportType,
  DataTypes,
  FunctionImportType,
  ModelTypes,
  OperationTypes,
  OperationType,
  PropertyModel,
} from "../data-model/DataTypeModel";

const ROOT_SERVICE = "ODataService";
const COMPILE_FUNCTION_PATH = "compileFunctionPath";
const COMPILE_ACTION_PATH = "compileActionPath";
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
            ...Object.values(container.singletons).map(({ name, odataName, type }) => {
              const serviceType = this.getServiceName(type.name);
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
        ...Object.values(container.singletons).map(({ name, type: entityType }) => {
          const type = this.getServiceName(entityType.name);

          importContainer.addGeneratedService(this.getServiceName(entityType.name), type);

          return {
            scope: Scope.Public,
            name,
            type,
          };
        }),
      ],
      methods: [
        ...this.generateUnboundOperations(
          [...Object.values(container.functions), ...Object.values(container.actions)],
          importContainer
        ),
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
      const operations = this.dataModel.getOperationTypeByBinding(model.name);
      const serviceFile = await this.project.createServiceFile(serviceName);
      const props = [...model.baseProps, ...model.props];
      const modelProps = props.filter((prop) => prop.dataType === DataTypes.ModelType);
      const primColProps = props.filter((prop) => prop.isCollection && prop.dataType !== DataTypes.ModelType);
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
              name: "_" + prop.name,
              type: `${propModelType}`,
              hasQuestionToken: true,
            } as PropertyDeclarationStructure;
          }),
          ...primColProps.map((prop) => {
            const isEnum = prop.dataType === DataTypes.EnumType;
            const type = isEnum
              ? `EnumCollection<${prop.type}>`
              : `${upperCaseFirst(prop.type.replace(/String$/, ""))}Collection`;
            const collectionType = `${collectionServiceType}<${type}>`;

            if (!prop.qObject) {
              throw Error("Illegal State: [qObject] must be provided for Collection types!");
            }

            importContainer.addFromService(collectionServiceType);
            importContainer.addFromQObject(prop.qObject);
            if (isEnum) {
              importContainer.addGeneratedModel(prop.type);
              importContainer.addFromQObject("EnumCollection");
            } else {
              importContainer.addFromQObject(type);
            }

            return {
              scope: Scope.Private,
              name: "_" + prop.name,
              type: `${collectionType}`,
              hasQuestionToken: true,
            };
          }),
        ],
        getAccessors: [
          ...modelProps.map((prop) => {
            const modelType = this.dataModel.getModel(prop.type);
            const isCollection = prop.isCollection && modelType.modelType === ModelTypes.ComplexType;
            const type = isCollection
              ? `${collectionServiceType}<${modelType.name}>`
              : this.getServiceNameForProp(prop);

            return {
              scope: Scope.Public,
              name: prop.name,
              returnType: type,
              statements: [
                `if(!this._${prop.name}) {`,
                // prettier-ignore
                `  this._${prop.name} = new ${type}(this.client, this.path + "/${prop.odataName}"${isCollection ? `, ${modelType.qName}`: ""})`,
                "}",
                `return this._${prop.name}`,
              ],
            } as GetAccessorDeclarationStructure;
          }),
          ...primColProps.map((prop) => {
            return {
              scope: Scope.Public,
              name: prop.name,
              statements: [
                `if(!this._${prop.name}) {`,
                // prettier-ignore
                `  this._${prop.name} = new ${collectionServiceType}(this.client, this.path + "/${prop.odataName}", ${prop.qObject})`,
                "}",
                `return this._${prop.name}`,
              ],
            } as GetAccessorDeclarationStructure;
          }),
        ],
        methods: [...this.generateBoundOperations(operations, importContainer)],
      });

      // now the entity collection service
      if (model.modelType === ModelTypes.EntityType) {
        importContainer.addFromService(entitySetServiceType, COMPILE_ID);

        const isSingleKey = model.keys.length === 1;
        const exactKeyType = `{ ${model.keys.map((k) => `${k.name}: ${k.type}`).join(", ")} }`;
        const keyType = `${isSingleKey ? model.keys[0].type + " | " : ""}${exactKeyType}`;
        const keySpec = this.createKeySpec(model.keys);

        model.keys.forEach((keyProp) => this.addTypeForProp(importContainer, keyProp));

        serviceFile.addClass({
          isExported: true,
          name: this.getCollectionServiceName(model.name),
          extends: entitySetServiceType + `<${model.name}, ${keyType}>`,
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
    const props = params.map(
      (p) => `{ isLiteral: ${!this.isQuotedValue(p)}, name: "${p.name}", odataName: "${p.odataName}" }`
    );
    return props.length ? `[${props.join(", ")}]` : undefined;
  }

  private createParamsSpec(params: Array<PropertyModel>): string | undefined {
    const props = params.map((p) => `${p.name}: { isLiteral: ${!this.isQuotedValue(p)}, value: params.${p.name} }`);
    return props.length ? `{ ${props.join(", ")} }` : undefined;
  }

  private generateBoundOperations(operations: Array<OperationType>, importContainer: ImportContainer) {
    return operations.map((op) =>
      this.generateMethod(op.name, this.dataModel.getServicePrefix() + op.odataName, op, importContainer)
    );
  }

  private generateUnboundOperations(
    operations: Array<FunctionImportType | ActionImportType>,
    importContainer: ImportContainer
  ) {
    return Object.values(operations).map(({ name, odataName, operation }) =>
      this.generateMethod(name, odataName, operation, importContainer)
    );
  }

  private generateMethod(
    name: string,
    odataName: string,
    operation: OperationType,
    importContainer: ImportContainer
  ): OptionalKind<MethodDeclarationStructure> {
    const isFunc = operation.type === OperationTypes.Function;
    const odataType = operation.returnType?.isCollection ? RESPONSE_TYPES.collection : RESPONSE_TYPES.model;
    const returnType = !operation.returnType ? "void" : operation.returnType.type;
    const paramsSpec = this.createParamsSpec(operation.parameters);

    importContainer.addFromClientApi("ODataResponse", odataType);
    importContainer.addFromService(isFunc ? COMPILE_FUNCTION_PATH : COMPILE_ACTION_PATH);
    if (operation.returnType?.type && returnType) {
      this.addTypeForProp(importContainer, operation.returnType);
    }

    // typing info for all parameters => as object
    const paramsStrings = operation.parameters.map((param) => {
      this.addTypeForProp(importContainer, param);
      return `${param.name}${!param.required ? "?" : ""}: ${param.isCollection ? `Array<${param.type}>` : param.type}`;
    });
    const optParamType = paramsStrings.length ? `{ ${paramsStrings.join(", ")} }` : undefined;
    const optParamOptional = operation.parameters.reduce((result, p) => result && !p.required, true);

    // url construction is different between function and action
    const url = isFunc
      ? `${COMPILE_FUNCTION_PATH}(this.getPath(), "${odataName}"${paramsSpec ? `, ${paramsSpec}` : ""})`
      : `${COMPILE_ACTION_PATH}(this.getPath(), "${odataName}")`;

    return {
      scope: Scope.Public,
      name,
      parameters: optParamType
        ? [{ name: "params", type: optParamType, initializer: optParamOptional ? "{}" : undefined }]
        : undefined,
      returnType: `ODataResponse<${odataType}<${returnType}>>`,
      statements: [
        `const url = ${url}`,
        `return this.client.${isFunc ? "get(url)" : `post(url, ${optParamType ? "params" : "{}"})`};`,
      ],
    };
  }

  private addTypeForProp(importContainer: ImportContainer, p: PropertyModel) {
    if (p.dataType === DataTypes.PrimitiveType && p.type.endsWith("String")) {
      importContainer.addFromQObject(p.type);
    } else if (p.dataType === DataTypes.EnumType || p.dataType === DataTypes.ModelType) {
      importContainer.addGeneratedModel(p.type);
    }
  }
}
