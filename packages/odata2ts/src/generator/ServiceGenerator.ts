import { ODataVersions } from "@odata2ts/odata-core";
import deepmerge from "deepmerge";
import {
  ClassDeclarationStructure,
  MethodDeclarationStructure,
  OptionalKind,
  PropertyDeclarationStructure,
  Scope,
  SourceFile,
} from "ts-morph";
import { upperCaseFirst } from "upper-case-first";
import { firstCharLowerCase } from "xml2js/lib/processors";

import { DataModel } from "../data-model/DataModel";
import {
  ActionImportType,
  ComplexType,
  DataTypes,
  EntityContainerModel,
  FunctionImportType,
  ModelType,
  OperationType,
  OperationTypes,
  PropertyModel,
  SingletonType,
} from "../data-model/DataTypeModel";
import { NamingHelper } from "../data-model/NamingHelper";
import { ConfigFileOptions } from "../OptionModel";
import { ProjectManager } from "../project/ProjectManager";
import { ImportContainer } from "./ImportContainer";

const ROOT_SERVICE = "ODataService";

const RESPONSE_TYPES = {
  collection: "ODataCollectionResponse",
  model: "ODataModelResponse",
  value: "ODataValueResponse",
};

export interface PropsAndOps extends Required<Pick<ClassDeclarationStructure, "properties" | "methods">> {}

export interface ServiceGeneratorOptions
  extends Pick<ConfigFileOptions, "enablePrimitivePropertyServices" | "v4BigNumberAsString"> {}

export async function generateServices(
  dataModel: DataModel,
  project: ProjectManager,
  version: ODataVersions,
  namingHelper: NamingHelper,
  options?: ServiceGeneratorOptions
) {
  const generator = new ServiceGenerator(dataModel, project, version, namingHelper, options);
  return generator.generate();
}

class ServiceGenerator {
  constructor(
    private dataModel: DataModel,
    private project: ProjectManager,
    private version: ODataVersions,
    private namingHelper: NamingHelper,
    private options: ServiceGeneratorOptions = {}
  ) {}

  private isV4BigNumber() {
    return this.options.v4BigNumberAsString && this.version === ODataVersions.V4;
  }

  public async generate(): Promise<void> {
    const sourceFile = await this.project.createMainServiceFile();
    const serviceName = this.namingHelper.getMainServiceName();
    const container = this.dataModel.getEntityContainer();
    const unboundOperations = [...Object.values(container.functions), ...Object.values(container.actions)];

    const importContainer = new ImportContainer(this.namingHelper.getFileNames());
    importContainer.addFromClientApi("ODataHttpClient");
    importContainer.addFromService(ROOT_SERVICE);

    const { properties, methods }: PropsAndOps = deepmerge(
      this.generateMainServiceProperties(container, importContainer),
      this.generateMainServiceOperations(unboundOperations, importContainer)
    );

    sourceFile.addClass({
      isExported: true,
      name: serviceName,
      typeParameters: ["ClientType extends ODataHttpClient"],
      extends: `${ROOT_SERVICE}<ClientType>`,
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

    await this.generateModelServices(sourceFile, importContainer);

    sourceFile.addImportDeclarations(importContainer.getImportDeclarations(false));
  }

  private generateMainServiceProperties(
    container: EntityContainerModel,
    importContainer: ImportContainer
  ): PropsAndOps {
    const result: PropsAndOps = { properties: [], methods: [] };

    Object.values(container.entitySets).forEach(({ name, odataName, entityType }) => {
      result.methods.push(this.generateRelatedServiceGetter(name, odataName, entityType, importContainer));
    });

    Object.values(container.singletons).forEach((singleton) => {
      result.properties.push(this.generateSingletonProp(singleton, importContainer));
      result.methods.push(this.generateSingletonGetter(singleton));
    });

    return result;
  }

  private generateMainServiceOperations(
    ops: Array<FunctionImportType | ActionImportType>,
    importContainer: ImportContainer
  ): PropsAndOps {
    const result: PropsAndOps = { properties: [], methods: [] };

    ops.forEach(({ operation, name }) => {
      result.properties.push(this.generateQOperationProp(operation));
      result.methods.push(this.generateMethod(name, operation, importContainer));
    });

    return result;
  }

  private generateRelatedServiceGetter(
    propName: string,
    odataPropName: string,
    entityType: ModelType,
    importContainer: ImportContainer,
    currentServiceName?: string
  ): OptionalKind<MethodDeclarationStructure> {
    const idName = entityType.idModelName;
    const idFunctionName = entityType.qIdFunctionName;
    const serviceName = this.namingHelper.getServiceName(entityType.name);
    const collectionName = this.namingHelper.getCollectionServiceName(entityType.name);

    importContainer.addFromClientApi("ODataHttpClient");
    importContainer.addGeneratedModel(idName);
    importContainer.addGeneratedQObject(idFunctionName);

    return {
      scope: Scope.Public,
      name: this.namingHelper.getRelatedServiceGetter(propName),
      parameters: [
        {
          name: "id",
          type: `${idName} | undefined`,
          hasQuestionToken: true,
        },
      ],
      overloads: [
        {
          parameters: [],
          returnType: `${collectionName}<ClientType>`,
        },
        {
          parameters: [
            {
              name: "id",
              type: idName,
            },
          ],
          returnType: `${serviceName}<ClientType>`,
        },
      ],
      statements: [
        `const fieldName = "${odataPropName}";`,
        `const { client, path } = this.__base;`,
        'return typeof id === "undefined" || id === null',
        `? new ${collectionName}(client, path, fieldName)`,
        `: new ${serviceName}(client, path, new ${idFunctionName}(fieldName).buildUrl(id));`,
      ],
    };
  }

  private generateSingletonProp(
    singleton: SingletonType,
    importContainer: ImportContainer
  ): OptionalKind<PropertyDeclarationStructure> {
    const { name, entityType } = singleton;
    const type = this.namingHelper.getServiceName(entityType.name);

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

  private generateSingletonGetter(singleton: SingletonType): OptionalKind<MethodDeclarationStructure> {
    const { name, odataName, entityType } = singleton;
    const propName = "this." + this.namingHelper.getPrivatePropName(name);
    const serviceType = this.namingHelper.getServiceName(entityType.name);

    return {
      scope: Scope.Public,
      name: this.namingHelper.getRelatedServiceGetter(name),
      statements: [
        `if(!${propName}) {`,
        `  const { client, path } = this.__base;`,
        // prettier-ignore
        `  ${propName} = new ${serviceType}(client, path, "${odataName}")`,
        "}",
        `return ${propName}`,
      ],
    };
  }

  private getVersionSuffix() {
    return this.version === ODataVersions.V2 ? "V2" : "V4";
  }

  private async generateEntityTypeService(
    model: ComplexType,
    serviceName: string,
    serviceFile: SourceFile,
    importContainer: ImportContainer
  ) {
    const entityServiceType = "EntityTypeService" + this.getVersionSuffix();

    const editableModelName = model.editableName;
    const qObjectName = firstCharLowerCase(model.qName);
    const operations = this.dataModel.getOperationTypeByBinding(model.name);
    const props = [...model.baseProps, ...model.props];

    importContainer.addFromService(entityServiceType);
    importContainer.addFromClientApi("ODataHttpClient");
    importContainer.addGeneratedModel(model.name, editableModelName);
    importContainer.addGeneratedQObject(model.qName, qObjectName);

    const { properties, methods }: PropsAndOps = deepmerge(
      this.generateServiceProperties(serviceName, props, importContainer),
      this.generateServiceOperations(operations, importContainer)
    );

    // generate EntityTypeService
    serviceFile.addClass({
      isExported: true,
      name: serviceName,
      typeParameters: ["ClientType extends ODataHttpClient"],
      extends: entityServiceType + `<ClientType, ${model.name}, ${editableModelName}, ${model.qName}>`,
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

  private getPrimitiveServiceType() {
    return "PrimitiveTypeService" + this.getVersionSuffix();
  }

  private generateServiceProperties(
    serviceName: string,
    props: Array<PropertyModel>,
    importContainer: ImportContainer
  ): PropsAndOps {
    const collectionServiceType = "CollectionService" + this.getVersionSuffix();
    const result: PropsAndOps = { properties: [], methods: [] };

    props.forEach((prop) => {
      if ((prop.dataType === DataTypes.ModelType && !prop.isCollection) || prop.dataType === DataTypes.ComplexType) {
        result.properties.push(this.generateModelProp(prop, collectionServiceType, serviceName, importContainer));
        result.methods.push(this.generateModelPropGetter(prop, collectionServiceType));
      } else if (prop.isCollection) {
        // collection of entity types
        if (prop.dataType === DataTypes.ModelType) {
          const entityType = this.dataModel.getModel(prop.type);
          result.methods.push(
            this.generateRelatedServiceGetter(prop.name, prop.odataName, entityType, importContainer, serviceName)
          );
        }
        // collection of primitive or complex types
        else {
          result.properties.push(this.generatePrimitiveCollectionProp(prop, collectionServiceType, importContainer));
          result.methods.push(this.generatePrimitiveCollectionGetter(prop, collectionServiceType));
        }
      } else if (this.options.enablePrimitivePropertyServices && prop.dataType === DataTypes.PrimitiveType) {
        result.properties.push(this.generatePrimitiveTypeProp(prop, importContainer));
        result.methods.push(this.generatePrimitiveTypeGetter(prop));
      }
    });

    return result;
  }

  private generateServiceOperations(operations: Array<OperationType>, importContainer: ImportContainer): PropsAndOps {
    const result: PropsAndOps = { properties: [], methods: [] };

    operations.forEach((operation) => {
      result.properties.push(this.generateQOperationProp(operation));
      result.methods.push(this.generateMethod(operation.name, operation, importContainer));
    });

    return result;
  }

  private generateModelProp(
    prop: PropertyModel,
    collectionServiceType: string,
    serviceName: string,
    importContainer: ImportContainer
  ): PropertyDeclarationStructure {
    const complexType = this.dataModel.getComplexType(prop.type);
    const key = this.namingHelper.getServiceName(prop.type);
    let propModelType = prop.isCollection ? this.namingHelper.getCollectionServiceName(prop.type) : key;

    if (prop.isCollection && complexType) {
      const editableName = complexType.editableName;
      importContainer.addFromService(collectionServiceType);
      importContainer.addGeneratedModel(complexType.name, editableName);
      importContainer.addGeneratedQObject(complexType.qName, firstCharLowerCase(complexType.qName));
      propModelType = `${collectionServiceType}<ClientType, ${complexType.name}, ${complexType.qName}, ${editableName}>`;
    } else {
      propModelType = `${propModelType}<ClientType>`;
    }

    return {
      scope: Scope.Private,
      name: this.namingHelper.getPrivatePropName(prop.name),
      type: propModelType,
      hasQuestionToken: true,
    } as PropertyDeclarationStructure;
  }

  private generatePrimitiveCollectionProp(
    prop: PropertyModel,
    collectionServiceType: string,
    importContainer: ImportContainer
  ): OptionalKind<PropertyDeclarationStructure> {
    const isEnum = prop.dataType === DataTypes.EnumType;
    const type = isEnum ? `EnumCollection<${prop.type}>` : `${upperCaseFirst(prop.type)}Collection`;
    const qType = isEnum ? "QEnumCollection" : prop.qObject;
    const collectionType = `${collectionServiceType}<ClientType, ${type}, ${qType}>`;

    if (!prop.qObject) {
      throw new Error("Illegal State: [qObject] must be provided for Collection types!");
    }

    importContainer.addFromService(collectionServiceType);
    importContainer.addFromQObject(prop.qObject, firstCharLowerCase(prop.qObject));
    if (isEnum) {
      importContainer.addGeneratedModel(prop.type);
      importContainer.addFromQObject("EnumCollection");
    } else {
      importContainer.addFromQObject(type);
    }

    return {
      scope: Scope.Private,
      name: this.namingHelper.getPrivatePropName(prop.name),
      type: `${collectionType}`,
      hasQuestionToken: true,
    };
  }

  private generatePrimitiveTypeProp(
    prop: PropertyModel,
    importContainer: ImportContainer
  ): OptionalKind<PropertyDeclarationStructure> {
    const serviceType = this.getPrimitiveServiceType();
    importContainer.addFromService(serviceType);
    if (prop.typeModule) {
      importContainer.addCustomType(prop.typeModule, prop.type);
    }

    return {
      scope: Scope.Private,
      name: this.namingHelper.getPrivatePropName(prop.name),
      type: `${serviceType}<ClientType, ${prop.type}>`,
      hasQuestionToken: true,
    };
  }

  private generateModelPropGetter(
    prop: PropertyModel,
    collectionServiceType: string
  ): OptionalKind<MethodDeclarationStructure> {
    const complexType = this.dataModel.getComplexType(prop.type);
    const isComplexCollection = prop.isCollection && complexType;
    const type = isComplexCollection
      ? collectionServiceType
      : prop.isCollection
      ? this.namingHelper.getCollectionServiceName(prop.type)
      : this.namingHelper.getServiceName(prop.type);
    const typeWithGenerics = isComplexCollection
      ? `${collectionServiceType}<ClientType, ${complexType.name}, ${complexType.qName}, ${complexType.editableName}>`
      : `${type}<ClientType>`;

    const privateSrvProp = "this." + this.namingHelper.getPrivatePropName(prop.name);

    return {
      scope: Scope.Public,
      name: this.namingHelper.getRelatedServiceGetter(prop.name),
      returnType: typeWithGenerics,
      statements: [
        `if(!${privateSrvProp}) {`,
        `  const { client, path } = this.__base;`,
        // prettier-ignore
        `  ${privateSrvProp} = new ${type}(client, path, "${prop.odataName}"${isComplexCollection ? `, ${firstCharLowerCase(complexType.qName)}`: ""})`,
        "}",
        `return ${privateSrvProp}`,
      ],
    };
  }

  private generatePrimitiveCollectionGetter(
    prop: PropertyModel,
    collectionServiceType: string
  ): OptionalKind<MethodDeclarationStructure> {
    const propName = "this." + this.namingHelper.getPrivatePropName(prop.name);
    return {
      scope: Scope.Public,
      name: this.namingHelper.getRelatedServiceGetter(prop.name),
      statements: [
        `if(!${propName}) {`,
        `  const { client, path } = this.__base;`,
        // prettier-ignore
        `  ${propName} = new ${collectionServiceType}(client, path, "${prop.odataName}", ${firstCharLowerCase(prop.qObject!)}${this.isV4BigNumber() ? ", true": ""})`,
        "}",
        `return ${propName}`,
      ],
    };
  }

  private generatePrimitiveTypeGetter(prop: PropertyModel): OptionalKind<MethodDeclarationStructure> {
    const serviceType = this.getPrimitiveServiceType();
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

  private async generateEntityCollectionService(
    model: ModelType,
    serviceFile: SourceFile,
    importContainer: ImportContainer
  ) {
    const entitySetServiceType = "EntitySetService" + this.getVersionSuffix();
    const editableModelName = model.editableName;
    const qObjectName = firstCharLowerCase(model.qName);

    importContainer.addFromService(entitySetServiceType);
    importContainer.addGeneratedModel(model.idModelName);
    importContainer.addGeneratedQObject(model.qIdFunctionName);

    const collectionOperations = this.dataModel.getOperationTypeByBinding(`Collection(${model.name})`);

    const { properties, methods } = this.generateServiceOperations(collectionOperations, importContainer);

    serviceFile.addClass({
      isExported: true,
      name: this.namingHelper.getCollectionServiceName(model.name),
      typeParameters: ["ClientType extends ODataHttpClient"],
      extends:
        entitySetServiceType +
        `<ClientType, ${model.name}, ${editableModelName}, ${model.qName}, ${model.idModelName}>`,
      ctors: [
        {
          parameters: [
            { name: "client", type: "ClientType" },
            { name: "basePath", type: "string" },
            { name: "name", type: "string" },
          ],
          statements: [
            `super(client, basePath, name, ${qObjectName}, new ${model.qIdFunctionName}(name)${
              this.isV4BigNumber() ? ", true" : ""
            });`,
          ],
        },
      ],
      properties,
      methods,
    });
  }

  private async generateModelServices(serviceFile: SourceFile, importContainer: ImportContainer) {
    // build service file for each entity, consisting of EntityTypeService & EntityCollectionService
    for (const model of this.dataModel.getModels()) {
      const serviceName = this.namingHelper.getServiceName(model.name);

      // entity type service
      await this.generateEntityTypeService(model, serviceName, serviceFile, importContainer);

      // entity collection service
      await this.generateEntityCollectionService(model, serviceFile, importContainer);
    }

    // build service file for complex types
    for (const model of this.dataModel.getComplexTypes()) {
      const serviceName = this.namingHelper.getServiceName(model.name);

      // entity type service
      await this.generateEntityTypeService(model, serviceName, serviceFile, importContainer);
    }
  }

  private generateMethod(
    name: string,
    operation: OperationType,
    importContainer: ImportContainer
  ): OptionalKind<MethodDeclarationStructure> {
    const isFunc = operation.type === OperationTypes.Function;
    const odataType = operation.returnType?.isCollection
      ? RESPONSE_TYPES.collection + this.getVersionSuffix()
      : operation.returnType?.dataType === DataTypes.PrimitiveType
      ? RESPONSE_TYPES.value + this.getVersionSuffix()
      : RESPONSE_TYPES.model + this.getVersionSuffix();
    const returnType = operation.returnType;
    const requestConfigParam = {
      name: "requestConfig",
      hasQuestionToken: true,
      type: "ODataHttpClientConfig<ClientType>",
    };
    const hasParams = operation.parameters.length > 0;

    // importing dependencies
    importContainer.addFromClientApi("ODataHttpClientConfig", "ODataResponse");
    importContainer.addFromCore(odataType);
    if (returnType?.type) {
      if ([DataTypes.EnumType, DataTypes.ModelType, DataTypes.ComplexType].includes(returnType.dataType)) {
        importContainer.addGeneratedModel(returnType.type);
      }
    }
    importContainer.addGeneratedQObject(operation.qName);
    if (hasParams) {
      importContainer.addGeneratedModel(operation.paramsModelName);
    }

    const qOpProp = "this." + this.namingHelper.getPrivatePropName(operation.qName);

    return {
      scope: Scope.Public,
      isAsync: true,
      name,
      parameters: hasParams
        ? [{ name: "params", type: operation.paramsModelName }, requestConfigParam]
        : [requestConfigParam],
      returnType: `ODataResponse<${odataType}<${returnType?.type || "void"}>>`,
      statements: [
        `if(!${qOpProp}) {`,
        `  ${qOpProp} = new ${operation.qName}()`,
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
}
