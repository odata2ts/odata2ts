import { ODataVersions } from "@odata2ts/odata-core";
import deepmerge from "deepmerge";
import {
  ClassDeclarationStructure,
  MethodDeclarationStructure,
  OptionalKind,
  PropertyDeclarationStructure,
  Scope,
} from "ts-morph";
import { upperCaseFirst } from "upper-case-first";
import { firstCharLowerCase } from "xml2js/lib/processors";

import { DataModel } from "../data-model/DataModel";
import {
  ActionImportType,
  ComplexType,
  DataTypes,
  EntityContainerModel,
  EntityType,
  FunctionImportType,
  OperationType,
  OperationTypes,
  PropertyModel,
  ReturnTypeModel,
  SingletonType,
} from "../data-model/DataTypeModel";
import { NamingHelper } from "../data-model/NamingHelper";
import { ConfigFileOptions } from "../OptionModel";
import { FileHandler } from "../project/FileHandler";
import { ProjectManager } from "../project/ProjectManager";
import { ApiInterfaceHandler } from "./api/ApiInterfaceHandler";
import { ServiceApiGenerator } from "./api/ServiceApiGenerator";
import { ClientApiImports, CoreImports, QueryObjectImports, ServiceImports } from "./import/ImportObjects";
import { ImportContainer } from "./ImportContainer";

export interface PropsAndOps extends Required<Pick<ClassDeclarationStructure, "properties" | "methods">> {}

export interface ServiceGeneratorOptions
  extends Pick<ConfigFileOptions, "enablePrimitivePropertyServices" | "v4BigNumberAsString"> {}

export async function generateServices(
  project: ProjectManager,
  dataModel: DataModel,
  version: ODataVersions,
  namingHelper: NamingHelper,
  options?: ServiceGeneratorOptions
) {
  const generator = new ServiceGenerator(project, dataModel, version, namingHelper, options);
  return generator.generate();
}

class ServiceGenerator {
  private serviceApiGenerator!: ServiceApiGenerator;

  constructor(
    private project: ProjectManager,
    private dataModel: DataModel,
    private version: ODataVersions,
    private namingHelper: NamingHelper,
    private options: ServiceGeneratorOptions = {}
  ) {}

  private isV4BigNumber() {
    return this.options.v4BigNumberAsString && this.version === ODataVersions.V4;
  }

  public async generate(): Promise<void> {
    this.project.initServices();

    this.serviceApiGenerator = new ServiceApiGenerator(
      this.project.getMainServiceApiFile(),
      this.dataModel,
      this.version,
      this.namingHelper,
      this.options
    );

    await Promise.all([
      this.generateMainService(),
      ...this.generateEntityTypeServices(),
      ...this.generateComplexTypeServices(),
    ]);

    return this.project.finalizeServices();
  }

  private async generateMainService() {
    const mainServiceName = this.namingHelper.getMainServiceName();
    const mainServiceFile = this.project.getMainServiceFile();
    const importContainer = mainServiceFile.getImports();
    const container = this.dataModel.getEntityContainer();
    const unboundOperations = [...Object.values(container.functions), ...Object.values(container.actions)];

    const [httpClient] = importContainer.addClientApi(ClientApiImports.ODataHttpClient);
    const [rootService] = importContainer.addServiceObject(this.version, ServiceImports.ODataService);

    const apiHandler = this.serviceApiGenerator.createMainInterfaceHandler();

    const { properties, methods }: PropsAndOps = deepmerge(
      this.processEntitySetsAndSingletons(container, importContainer, apiHandler),
      this.processUnboundOperations(unboundOperations, importContainer, apiHandler)
    );

    const realApiName = this.serviceApiGenerator.finalizeInterface(apiHandler);
    const mainApiName = importContainer.addGeneratedServiceApi(realApiName);

    mainServiceFile.getFile().addClass({
      isExported: true,
      name: mainServiceName,
      typeParameters: [`ClientType extends ${httpClient}`],
      extends: `${rootService}<ClientType>`,
      implements: [`${mainApiName}<ClientType>`],
      ctors: this.isV4BigNumber()
        ? [
            {
              parameters: [
                { name: "client", type: "ClientType" },
                { name: "basePath", type: "string" },
              ],
              statements: [`super(client, basePath, true);`],
            },
          ]
        : [],
      properties,
      methods,
    });
  }

  private processEntitySetsAndSingletons(
    container: EntityContainerModel,
    importContainer: ImportContainer,
    apiHandler: ApiInterfaceHandler
  ): PropsAndOps {
    const result: PropsAndOps = { properties: [], methods: [] };

    Object.values(container.entitySets).forEach(({ name, odataName, entityType }) => {
      result.methods.push(this.generateRelatedServiceGetter(name, odataName, entityType, importContainer, apiHandler));
    });

    Object.values(container.singletons).forEach((singleton) => {
      result.properties.push(this.generateSingletonProp(importContainer, singleton));
      result.methods.push(this.generateSingletonGetter(singleton, apiHandler));
    });

    return result;
  }

  private processUnboundOperations(
    ops: Array<FunctionImportType | ActionImportType>,
    importContainer: ImportContainer,
    apiHandler: ApiInterfaceHandler
  ): PropsAndOps {
    const result: PropsAndOps = { properties: [], methods: [] };

    ops.forEach(({ operation, name }) => {
      const op = this.dataModel.getUnboundOperationType(operation);
      if (!op) {
        throw new Error(`Operation "${operation}" not found!`);
      }

      result.properties.push(this.generateQOperationProp(op));
      result.methods.push(this.generateMethod(name, op, importContainer, "", apiHandler));
      // this.serviceApiGenerator.addMainApiMethod(name)
    });

    return result;
  }

  private generateRelatedServiceGetter(
    propName: string,
    odataPropName: string,
    entityType: EntityType,
    imports: ImportContainer,
    apiHandler: ApiInterfaceHandler
  ): OptionalKind<MethodDeclarationStructure> {
    const idType = imports.addGeneratedModel(entityType.id.fqName, entityType.id.modelName);
    const idFunctionName = imports.addGeneratedQObject(entityType.id.fqName, entityType.id.qName);
    const serviceName = imports.addGeneratedService(entityType.fqName, entityType.serviceName);
    const collectionName = imports.addGeneratedService(entityType.fqName, entityType.serviceCollectionName);
    const name = this.namingHelper.getRelatedServiceGetter(propName);

    const [apiName, collectionApiName] = apiHandler.addEntityGetter(name, entityType);

    return {
      scope: Scope.Public,
      name,
      parameters: [
        {
          name: "id",
          type: `${idType}`,
          hasQuestionToken: true,
        },
      ],
      returnType: `${imports.addGeneratedServiceApi(apiName)}<ClientType> | ${imports.addGeneratedServiceApi(
        collectionApiName
      )}<ClientType>`,
      // overloads: [
      //   {
      //     parameters: [],
      //     returnType: `${imports.addGeneratedServiceApi(collectionApiName)}<ClientType>`,
      //   },
      //   {
      //     parameters: [
      //       {
      //         name: "id",
      //         type: idType,
      //       },
      //     ],
      //     returnType: `${imports.addGeneratedServiceApi(apiName)}<ClientType>`,
      //   },
      // ],
      statements: [
        `const fieldName = "${odataPropName}";`,
        `const { client, path } = this.__base;`,
        'return typeof id === "undefined" || id === null',
        // "// @ts-ignore",
        `? new ${collectionName}(client, path, fieldName) as ${collectionApiName}<ClientType>`,
        // "// @ts-ignore",
        `: new ${serviceName}(client, path, new ${idFunctionName}(fieldName).buildUrl(id)) as ${apiName}<ClientType>;`,
      ],
    };
  }

  private generateSingletonProp(
    importContainer: ImportContainer,
    singleton: SingletonType
  ): OptionalKind<PropertyDeclarationStructure> {
    const { name, entityType } = singleton;
    const type = entityType.serviceName;

    return {
      scope: Scope.Private,
      name: this.namingHelper.getPrivatePropName(name),
      type: `${type}<ClientType>`,
      hasQuestionToken: true,
    };
  }

  private generateQOperationProp = (operation: OperationType) => {
    return {
      scope: Scope.Private,
      name: this.namingHelper.getPrivatePropName(operation.qName),
      type: operation.qName,
      hasQuestionToken: true,
    };
  };

  private generateSingletonGetter(
    singleton: SingletonType,
    apiHandler: ApiInterfaceHandler
  ): OptionalKind<MethodDeclarationStructure> {
    const { name, odataName, entityType } = singleton;
    const propName = "this." + this.namingHelper.getPrivatePropName(name);
    const serviceType = entityType.serviceName;
    const methodName = this.namingHelper.getRelatedServiceGetter(name);

    const returnType = apiHandler.addSingletonGetter(methodName, entityType);

    return {
      scope: Scope.Public,
      name: methodName,
      returnType,
      statements: [
        `if(!${propName}) {`,
        `  const { client, path } = this.__base;`,
        // "// @ts-ignore",
        `  ${propName} = new ${serviceType}(client, path, "${odataName}")`,
        "}",
        `return ${propName}`,
      ],
    };
  }

  private generateEntityTypeService(file: FileHandler, model: ComplexType) {
    const importContainer = file.getImports();
    const apiHandler = this.serviceApiGenerator.createInterfaceHandler(
      this.namingHelper.getServiceApiName(model.name),
      true
    );

    const operations = this.dataModel.getEntityTypeOperations(model.fqName);
    const props = [...model.baseProps, ...model.props];

    const [entityServiceType] = importContainer.addServiceObject(this.version, ServiceImports.EntityTypeService);
    const [httpClient] = importContainer.addClientApi(ClientApiImports.ODataHttpClient);

    // note: predictable first imports => no need to take renaming into account
    const modelName = importContainer.addGeneratedModel(model.fqName, model.modelName);
    const editableModelName = importContainer.addGeneratedModel(model.fqName, model.editableName);
    const qName = importContainer.addGeneratedQObject(model.fqName, model.qName);
    const qObjectName = importContainer.addGeneratedQObject(model.fqName, firstCharLowerCase(model.qName));

    const { properties, methods }: PropsAndOps = deepmerge(
      this.processServiceProperties(importContainer, model.serviceName, props, apiHandler),
      this.generateServiceOperations(importContainer, model, operations, apiHandler)
    );

    const realApiName = this.serviceApiGenerator.finalizeInterface(apiHandler);
    const apiName = importContainer.addGeneratedServiceApi(realApiName);

    // generate EntityTypeService
    file.getFile().addClass({
      isExported: true,
      name: model.serviceName,
      typeParameters: [`ClientType extends ${httpClient}`],
      extends: entityServiceType + `<ClientType, ${modelName}, ${editableModelName}, ${qName}>`,
      implements: [`${apiName}<ClientType>`],
      ctors: [
        {
          parameters: [
            { name: "client", type: "ClientType" },
            { name: "basePath", type: "string" },
            { name: "name", type: "string" },
          ],
          statements: [`super(client, basePath, name, ${qObjectName}${this.isV4BigNumber() ? ", true" : ""});`],
        },
      ],
      properties,
      methods,
    });
  }

  private processServiceProperties(
    importContainer: ImportContainer,
    serviceName: string,
    props: Array<PropertyModel>,
    apiHandler: ApiInterfaceHandler
  ): PropsAndOps {
    const result: PropsAndOps = { properties: [], methods: [] };

    props.forEach((prop) => {
      // collection of entity types
      if (prop.isCollection && prop.dataType === DataTypes.EntityType) {
        const entityType = this.dataModel.getEntityType(prop.fqType);
        if (!entityType) {
          throw new Error(`Entity type "${prop.fqType}" specified by property not found!`);
        }

        result.methods.push(
          this.generateRelatedServiceGetter(prop.name, prop.odataName, entityType, importContainer, apiHandler)
        );
      }
      // entity types, complex types or collection of complex types
      else if (prop.dataType === DataTypes.EntityType || prop.dataType === DataTypes.ComplexType) {
        result.properties.push(this.generateModelProp(importContainer, prop));
        result.methods.push(this.generateModelPropGetter(importContainer, prop, apiHandler));
      }
      // collection of primitive or enum types
      else if (prop.isCollection) {
        result.properties.push(this.generatePrimitiveCollectionProp(importContainer, prop));
        result.methods.push(this.generatePrimitiveCollectionGetter(importContainer, prop, apiHandler));
      }
      // generation of services for each primitive property: turned off by default
      else if (this.options.enablePrimitivePropertyServices && prop.dataType === DataTypes.PrimitiveType) {
        result.properties.push(this.generatePrimitiveTypeProp(importContainer, prop));
        result.methods.push(this.generatePrimitiveTypeGetter(importContainer, prop, apiHandler));
      }
    });

    return result;
  }

  private generateServiceOperations(
    importContainer: ImportContainer,
    model: ComplexType,
    operations: Array<OperationType>,
    apiHandler: ApiInterfaceHandler
  ): PropsAndOps {
    const result: PropsAndOps = { properties: [], methods: [] };

    operations.forEach((operation) => {
      result.properties.push(this.generateQOperationProp(operation));
      result.methods.push(this.generateMethod(operation.name, operation, importContainer, model.fqName, apiHandler));
    });

    return result;
  }

  private generateModelProp(imports: ImportContainer, prop: PropertyModel): PropertyDeclarationStructure {
    const propModel = this.dataModel.getModel(prop.fqType) as ComplexType;
    let propModelType: string;

    if (prop.isCollection) {
      const modelName = imports.addGeneratedModel(propModel.fqName, propModel.modelName);
      const editableModelName = imports.addGeneratedModel(propModel.fqName, propModel.editableName);
      const qModelName = imports.addGeneratedQObject(propModel.fqName, propModel.qName);
      const [collectionServiceType] = imports.addServiceObject(this.version, ServiceImports.CollectionService);

      propModelType = `${collectionServiceType}<ClientType, ${modelName}, ${qModelName}, ${editableModelName}>`;
    } else {
      const apiName = this.namingHelper.getServiceApiName(propModel.name);
      propModelType = `${imports.addGeneratedServiceApi(apiName)}<ClientType>`;
    }

    return {
      scope: Scope.Private,
      name: this.namingHelper.getPrivatePropName(prop.name),
      type: propModelType,
      hasQuestionToken: true,
    } as PropertyDeclarationStructure;
  }

  private generatePrimitiveCollectionProp(
    imports: ImportContainer,
    prop: PropertyModel
  ): OptionalKind<PropertyDeclarationStructure> {
    if (!prop.qObject) {
      throw new Error("Illegal State: [qObject] must be provided for Collection types!");
    }

    const [collectionServiceType] = imports.addServiceObject(this.version, ServiceImports.CollectionService);
    const isEnum = prop.dataType === DataTypes.EnumType;
    let qType: string;
    let type: string;

    if (!isEnum) {
      // TODO move string concat (StringCollection, GuidCollection...) to better place
      [type, qType] = imports.addFromQObject(`${upperCaseFirst(prop.type)}Collection`, prop.qObject);
    } else {
      const propEnum = this.dataModel.getModel(prop.fqType)!;
      const propTypeModel = imports.addGeneratedModel(propEnum.fqName, propEnum.modelName);
      [type, qType] = imports.addQObject(QueryObjectImports.EnumCollection, QueryObjectImports.QEnumCollection);
      type = `${type}<${propTypeModel}>`;
    }

    const collectionType = `${collectionServiceType}<ClientType, ${type}, ${qType}>`;

    return {
      scope: Scope.Private,
      name: this.namingHelper.getPrivatePropName(prop.name),
      type: `${collectionType}`,
      hasQuestionToken: true,
    };
  }

  private generatePrimitiveTypeProp(
    imports: ImportContainer,
    prop: PropertyModel
  ): OptionalKind<PropertyDeclarationStructure> {
    const [serviceType] = imports.addServiceObject(this.version, ServiceImports.PrimitiveTypeService);
    const type = prop.typeModule ? imports.addCustomType(prop.typeModule, prop.type) : prop.type;

    return {
      scope: Scope.Private,
      name: this.namingHelper.getPrivatePropName(prop.name),
      type: `${serviceType}<ClientType, ${type}>`,
      hasQuestionToken: true,
    };
  }

  private generateModelPropGetter(
    imports: ImportContainer,
    prop: PropertyModel,
    apiHandler: ApiInterfaceHandler
  ): OptionalKind<MethodDeclarationStructure> {
    const model = this.dataModel.getModel(prop.fqType) as ComplexType;
    const isComplexCollection = prop.isCollection && model.dataType === DataTypes.ComplexType;
    const name = this.namingHelper.getRelatedServiceGetter(prop.name);
    const privateSrvProp = "this." + this.namingHelper.getPrivatePropName(prop.name);
    const type = isComplexCollection
      ? imports.addServiceObject(this.version, ServiceImports.CollectionService)[0]
      : prop.isCollection
      ? imports.addGeneratedService(model.fqName, model.serviceCollectionName)
      : imports.addGeneratedService(model.fqName, model.serviceName);

    const returnType = apiHandler.addModelPropGetter(name, prop, model);

    return {
      scope: Scope.Public,
      name,
      returnType,
      statements: [
        `if(!${privateSrvProp}) {`,
        `  const { client, path } = this.__base;`,
        // "  // @ts-ignore",
        // prettier-ignore
        `  ${privateSrvProp} = new ${type}(client, path, "${prop.odataName}"${isComplexCollection ? `, ${imports.addGeneratedQObject(model.fqName, firstCharLowerCase(model.qName))}`: ""})`,
        "}",
        `return ${privateSrvProp}`,
      ],
    };
  }

  private generatePrimitiveCollectionGetter(
    imports: ImportContainer,
    prop: PropertyModel,
    apiHandler: ApiInterfaceHandler
  ): OptionalKind<MethodDeclarationStructure> {
    const [collectionServiceType] = imports.addServiceObject(this.version, ServiceImports.CollectionService);
    const instanceName = firstCharLowerCase(prop.qObject!);
    const [qInstanceName] = imports.addFromQObject(instanceName);

    const propName = "this." + this.namingHelper.getPrivatePropName(prop.name);
    return {
      scope: Scope.Public,
      name: this.namingHelper.getRelatedServiceGetter(prop.name),
      statements: [
        `if(!${propName}) {`,
        `  const { client, path } = this.__base;`,
        // prettier-ignore
        `  ${propName} = new ${collectionServiceType}(client, path, "${prop.odataName}", ${qInstanceName}${this.isV4BigNumber() ? ", true": ""})`,
        "}",
        `return ${propName}`,
      ],
    };
  }

  private generatePrimitiveTypeGetter(
    imports: ImportContainer,
    prop: PropertyModel,
    apiHandler: ApiInterfaceHandler
  ): OptionalKind<MethodDeclarationStructure> {
    const [serviceType] = imports.addServiceObject(this.version, ServiceImports.PrimitiveTypeService);
    const propName = "this." + this.namingHelper.getPrivatePropName(prop.name);
    // for V2: mapped name must be specified
    const useMappedName = this.version === ODataVersions.V2 && prop.name !== prop.odataName;
    // for V4: big number support
    const useBigNumber = this.isV4BigNumber();
    const addParamString = useMappedName ? `, "${prop.name}"` : useBigNumber ? ", true" : "";

    return {
      scope: Scope.Public,
      name: this.namingHelper.getRelatedServiceGetter(prop.name),
      statements: [
        `if(!${propName}) {`,
        `  const { client, path, qModel } = this.__base;`,
        `  ${propName} = new ${serviceType}(client, path, "${prop.odataName}", qModel.${prop.name}.converter${addParamString})`,
        "}",
        `return ${propName}`,
      ],
    };
  }

  private generateEntityCollectionService(file: FileHandler, model: EntityType) {
    const importContainer = file.getImports();
    const editableModelName = model.editableName;
    const qObjectName = firstCharLowerCase(model.qName);
    const apiHandler = this.serviceApiGenerator.createInterfaceHandler(
      this.namingHelper.getServiceCollectionApiName(model.name),
      true
    );

    const [entitySetServiceType] = importContainer.addServiceObject(this.version, ServiceImports.EntitySetService);
    const paramsModelName = importContainer.addGeneratedModel(model.id.fqName, model.id.modelName);
    const qIdFunctionName = importContainer.addGeneratedQObject(model.id.fqName, model.id.qName);

    const collectionOperations = this.dataModel.getEntitySetOperations(model.fqName);

    const { properties, methods } = this.generateServiceOperations(
      importContainer,
      model,
      collectionOperations,
      apiHandler
    );

    const realApiName = this.serviceApiGenerator.finalizeInterface(apiHandler);
    const apiName = importContainer.addGeneratedServiceApi(realApiName);

    file.getFile().addClass({
      isExported: true,
      name: model.serviceCollectionName,
      typeParameters: ["ClientType extends ODataHttpClient"],
      extends:
        entitySetServiceType +
        `<ClientType, ${model.modelName}, ${editableModelName}, ${model.qName}, ${paramsModelName}>`,
      implements: [`${apiName}<ClientType>`],
      ctors: [
        {
          parameters: [
            { name: "client", type: "ClientType" },
            { name: "basePath", type: "string" },
            { name: "name", type: "string" },
          ],
          statements: [
            `super(client, basePath, name, ${qObjectName}, new ${qIdFunctionName}(name)${
              this.isV4BigNumber() ? ", true" : ""
            });`,
          ],
        },
      ],
      properties,
      methods,
    });
  }

  private generateEntityTypeServices(): Array<Promise<void>> {
    // build service file for each entity, consisting of EntityTypeService & EntityCollectionService
    return this.dataModel.getEntityTypes().map((model) => {
      const file = this.project.createOrGetServiceFile(model.folderPath, model.serviceName, [
        model.serviceName,
        model.serviceCollectionName,
      ]);

      // entity type service
      this.generateEntityTypeService(file, model);
      // entity collection service if this entity specified keys at all
      if (model.keyNames.length) {
        this.generateEntityCollectionService(file, model);
      }

      return this.project.finalizeFile(file);
    });
  }

  private generateComplexTypeServices(): Array<Promise<void>> {
    // build service file for complex types
    return this.dataModel.getComplexTypes().map((model) => {
      const file = this.project.createOrGetServiceFile(model.folderPath, model.serviceName, [model.serviceName]);

      // entity type service
      this.generateEntityTypeService(file, model);

      return this.project.finalizeFile(file);
    });
  }

  private generateMethod(
    name: string,
    operation: OperationType,
    importContainer: ImportContainer,
    baseFqName: string,
    apiHandler: ApiInterfaceHandler
  ): OptionalKind<MethodDeclarationStructure> {
    const isFunc = operation.type === OperationTypes.Function;
    const returnType = operation.returnType;
    const hasParams = operation.parameters.length > 0;

    // importing dependencies
    const [httpClientConfigModel, odataResponse] = importContainer.addClientApi(
      ClientApiImports.ODataHttpClientConfig,
      ClientApiImports.HttpResponseModel
    );
    const responseStructure = this.importReturnType(importContainer, returnType);
    const qOperationName = importContainer.addGeneratedQObject(baseFqName, operation.qName);
    const rtType =
      returnType?.type && returnType.dataType !== DataTypes.PrimitiveType
        ? importContainer.addGeneratedModel(returnType.fqType, returnType.type)
        : returnType?.type;
    const paramsModelName = hasParams
      ? importContainer.addGeneratedModel(baseFqName, operation.paramsModelName)
      : undefined;

    const requestConfigParam = {
      name: "requestConfig",
      hasQuestionToken: true,
      type: `${httpClientConfigModel}<ClientType>`,
    };
    const qOpProp = "this." + this.namingHelper.getPrivatePropName(operation.qName);

    return {
      scope: Scope.Public,
      isAsync: true,
      name,
      parameters: hasParams ? [{ name: "params", type: paramsModelName }, requestConfigParam] : [requestConfigParam],
      returnType: `Promise<${odataResponse}<${responseStructure}<${rtType || "void"}>>>`,
      statements: [
        `if(!${qOpProp}) {`,
        `  ${qOpProp} = new ${qOperationName}()`,
        "}",

        `const { addFullPath, client, getDefaultHeaders } = this.__base;`,
        `const url = addFullPath(${qOpProp}.buildUrl(${isFunc && hasParams ? "params" : ""}));`,
        `${returnType ? "const response = await " : "return"} client.${
          !isFunc
            ? // actions: since V4
              `post(url, ${hasParams ? `${qOpProp}.convertUserParams(params)` : "{}"}, ${
                requestConfigParam.name
              }, getDefaultHeaders())`
            : operation.usePost
            ? // V2 POST => BUT values are still query params, they are not part of the request body
              `post(url, undefined, ${requestConfigParam.name}, getDefaultHeaders())`
            : // functions: since V2
              `get(url, ${requestConfigParam.name}, getDefaultHeaders())`
        };`,
        returnType ? `return ${qOpProp}.convertResponse(response);` : "",
      ],
    };
  }

  private importReturnType(imports: ImportContainer, returnType: ReturnTypeModel | undefined): string {
    const typeToImport: CoreImports = returnType?.isCollection
      ? CoreImports.ODataCollectionResponse
      : returnType?.dataType === DataTypes.PrimitiveType
      ? CoreImports.ODataValueResponse
      : CoreImports.ODataModelResponse;

    return imports.addCoreLib(this.version, typeToImport)[0];
  }
}
