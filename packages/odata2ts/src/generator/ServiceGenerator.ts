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
  SingletonType,
} from "../data-model/DataTypeModel";
import { NamingHelper } from "../data-model/NamingHelper";
import { ConfigFileOptions } from "../OptionModel";
import { FileWrapper } from "../project/FileWrapper";
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

    await Promise.all([
      this.generateMainService(),
      ...this.generateEntityTypeServices(),
      ...this.generateComplexTypeServices(),
    ]);

    return this.project.finalizeServices();
  }

  private generateMainService() {
    const mainServiceFile = this.project.getMainServiceFile();
    const importContainer = mainServiceFile.getImports();
    const serviceName = this.namingHelper.getMainServiceName();
    const container = this.dataModel.getEntityContainer();
    const unboundOperations = [...Object.values(container.functions), ...Object.values(container.actions)];

    importContainer.addFromClientApi("ODataHttpClient");
    importContainer.addFromService(ROOT_SERVICE);

    const { properties, methods }: PropsAndOps = deepmerge(
      this.generateMainServiceProperties(container, importContainer),
      this.generateMainServiceOperations(unboundOperations, importContainer)
    );

    mainServiceFile.getFile().addClass({
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

    return this.project.finalizeFile(mainServiceFile);
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
      result.properties.push(this.generateSingletonProp(importContainer, singleton));
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
      const op = this.dataModel.getUnboundOperationType(operation);
      if (!op) {
        throw new Error(`Operation "${operation}" not found!`);
      }

      result.properties.push(this.generateQOperationProp(op));
      result.methods.push(this.generateMethod(name, op, importContainer, op.fqName));
    });

    return result;
  }

  private generateRelatedServiceGetter(
    propName: string,
    odataPropName: string,
    entityType: EntityType,
    importContainer: ImportContainer
  ): OptionalKind<MethodDeclarationStructure> {
    importContainer.addFromClientApi("ODataHttpClient");
    const idName = importContainer.addGeneratedModel(entityType.id.fqName, entityType.id.modelName);
    const idFunctionName = importContainer.addGeneratedQObject(entityType.id.fqName, entityType.id.qName);
    const serviceName = importContainer.addGeneratedService(entityType.fqName, entityType.serviceName);
    const collectionName = importContainer.addGeneratedService(entityType.fqName, entityType.serviceCollectionName);

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

  private generateSingletonGetter(singleton: SingletonType): OptionalKind<MethodDeclarationStructure> {
    const { name, odataName, entityType } = singleton;
    const propName = "this." + this.namingHelper.getPrivatePropName(name);
    const serviceType = entityType.serviceName;

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

  private generateEntityTypeService(file: FileWrapper, model: ComplexType) {
    const importContainer = file.getImports();
    const entityServiceType = "EntityTypeService" + this.getVersionSuffix();

    const editableModelName = model.editableName;
    const qObjectName = firstCharLowerCase(model.qName);
    const operations = this.dataModel.getEntityTypeOperations(model.fqName);
    const props = [...model.baseProps, ...model.props];

    importContainer.addFromService(entityServiceType);
    importContainer.addFromClientApi("ODataHttpClient");

    // note: predictable first imports => no need to take renaming into account
    importContainer.addGeneratedModel(model.fqName, model.modelName);
    importContainer.addGeneratedModel(model.fqName, model.editableName);
    importContainer.addGeneratedQObject(model.fqName, model.qName);
    importContainer.addGeneratedQObject(model.fqName, firstCharLowerCase(model.qName));

    const { properties, methods }: PropsAndOps = deepmerge(
      this.generateServiceProperties(importContainer, model.serviceName, props),
      this.generateServiceOperations(importContainer, model, operations)
    );

    // generate EntityTypeService
    file.getFile().addClass({
      isExported: true,
      name: model.serviceName,
      typeParameters: ["ClientType extends ODataHttpClient"],
      extends: entityServiceType + `<ClientType, ${model.modelName}, ${editableModelName}, ${model.qName}>`,
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
    importContainer: ImportContainer,
    serviceName: string,
    props: Array<PropertyModel>
  ): PropsAndOps {
    const collectionServiceType = "CollectionService" + this.getVersionSuffix();
    const result: PropsAndOps = { properties: [], methods: [] };

    props.forEach((prop) => {
      // complex types, collection of complex types or entityTypes
      if ((prop.dataType === DataTypes.ModelType && !prop.isCollection) || prop.dataType === DataTypes.ComplexType) {
        // result.properties.push(this.generateModelProp(importContainer, prop, collectionServiceType));
        // result.methods.push(this.generateModelPropGetter(prop, collectionServiceType));
      } else if (prop.isCollection) {
        // collection of entity types
        if (prop.dataType === DataTypes.ModelType) {
          const entityType = this.dataModel.getEntityType(prop.fqType);
          if (!entityType) {
            throw new Error(`Entity type "${prop.fqType}" specified by property not found!`);
          }

          // result.methods.push(
          //   this.generateRelatedServiceGetter(prop.name, prop.odataName, entityType, importContainer)
          // );
        }
        // collection of primitive or enum types
        else {
          result.properties.push(this.generatePrimitiveCollectionProp(importContainer, prop, collectionServiceType));
          result.methods.push(this.generatePrimitiveCollectionGetter(prop, collectionServiceType));
        }
      }
      // generation of services for each primitive property: turned off by default
      else if (this.options.enablePrimitivePropertyServices && prop.dataType === DataTypes.PrimitiveType) {
        result.properties.push(this.generatePrimitiveTypeProp(importContainer, prop));
        result.methods.push(this.generatePrimitiveTypeGetter(prop));
      }
    });

    return result;
  }

  private generateServiceOperations(
    importContainer: ImportContainer,
    model: ComplexType,
    operations: Array<OperationType>
  ): PropsAndOps {
    const result: PropsAndOps = { properties: [], methods: [] };

    operations.forEach((operation) => {
      result.properties.push(this.generateQOperationProp(operation));
      result.methods.push(this.generateMethod(operation.name, operation, importContainer, model.fqName));
    });

    return result;
  }

  private generateModelProp(
    importContainer: ImportContainer,
    prop: PropertyModel,
    collectionServiceType: string
  ): PropertyDeclarationStructure {
    const propModel = this.dataModel.getModel(prop.fqType) as ComplexType;
    let propModelType: string;

    if (prop.isCollection) {
      const modelName = importContainer.addGeneratedModel(propModel.fqName, propModel.modelName);
      const editableModelName = importContainer.addGeneratedModel(propModel.fqName, propModel.editableName);
      const qModelName = importContainer.addGeneratedQObject(propModel.fqName, propModel.qName);
      importContainer.addFromService(collectionServiceType);
      propModelType = `${collectionServiceType}<ClientType, ${modelName}, ${qModelName}, ${editableModelName}>`;
    } else {
      const serviceName = importContainer.addGeneratedService(propModel.fqName, propModel.serviceName);
      propModelType = `${serviceName}<ClientType>`;
    }

    return {
      scope: Scope.Private,
      name: this.namingHelper.getPrivatePropName(prop.name),
      type: propModelType,
      hasQuestionToken: true,
    } as PropertyDeclarationStructure;
  }

  private generatePrimitiveCollectionProp(
    importContainer: ImportContainer,
    prop: PropertyModel,
    collectionServiceType: string
  ): OptionalKind<PropertyDeclarationStructure> {
    if (!prop.qObject) {
      throw new Error("Illegal State: [qObject] must be provided for Collection types!");
    }
    importContainer.addFromService(collectionServiceType);
    importContainer.addFromQObject(prop.qObject, firstCharLowerCase(prop.qObject));

    const isEnum = prop.dataType === DataTypes.EnumType;
    let qType: string;
    let type: string;

    if (!isEnum) {
      qType = prop.qObject;
      type = `${upperCaseFirst(prop.type)}Collection`;
      importContainer.addFromQObject(type);
    } else {
      const propEnum = this.dataModel.getModel(prop.fqType)!;
      const propTypeModel = importContainer.addGeneratedModel(propEnum.fqName, propEnum.modelName);
      importContainer.addFromQObject("EnumCollection");
      qType = "QEnumCollection";
      type = `EnumCollection<${propTypeModel}>`;
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
    importContainer: ImportContainer,
    prop: PropertyModel
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
    importContainer: ImportContainer,
    prop: PropertyModel,
    collectionServiceType: string
  ): OptionalKind<MethodDeclarationStructure> {
    const model = this.dataModel.getModel(prop.fqType) as ComplexType;
    const isComplexCollection = prop.isCollection && model.dataType === DataTypes.ComplexType;

    const modelName = importContainer.addGeneratedModel(model.fqName, model.modelName);
    const editableModelName = importContainer.addGeneratedModel(model.fqName, model.editableName);
    const qModelName = importContainer.addGeneratedQObject(model.fqName, model.qName);
    const qInstanceName = importContainer.addGeneratedQObject(model.fqName, firstCharLowerCase(model.qName));

    const type = isComplexCollection
      ? collectionServiceType
      : prop.isCollection
      ? model.serviceCollectionName
      : model.serviceName;
    const typeWithGenerics = isComplexCollection
      ? `${collectionServiceType}<ClientType, ${modelName}, ${qModelName}, ${editableModelName}>`
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
        `  ${privateSrvProp} = new ${type}(client, path, "${prop.odataName}"${isComplexCollection ? `, ${qInstanceName}`: ""})`,
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

  private generateEntityCollectionService(file: FileWrapper, model: EntityType) {
    const importContainer = file.getImports();
    const entitySetServiceType = "EntitySetService" + this.getVersionSuffix();
    const editableModelName = model.editableName;
    const qObjectName = firstCharLowerCase(model.qName);

    importContainer.addFromService(entitySetServiceType);
    const paramsModelName = importContainer.addGeneratedModel(model.id.fqName, model.id.modelName);
    const qIdFunctionName = importContainer.addGeneratedQObject(model.id.fqName, model.id.qName);

    const collectionOperations = this.dataModel.getEntitySetOperations(model.fqName);

    const { properties, methods } = this.generateServiceOperations(importContainer, model, collectionOperations);

    file.getFile().addClass({
      isExported: true,
      name: model.serviceCollectionName,
      typeParameters: ["ClientType extends ODataHttpClient"],
      extends:
        entitySetServiceType +
        `<ClientType, ${model.modelName}, ${editableModelName}, ${model.qName}, ${paramsModelName}>`,
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
      const file = this.project.createOrGetServiceFile(model.folderPath, model.serviceName);

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
      const file = this.project.createOrGetServiceFile(model.folderPath, model.serviceName);

      // entity type service
      this.generateEntityTypeService(file, model);

      return this.project.finalizeFile(file);
    });
  }

  private generateMethod(
    name: string,
    operation: OperationType,
    importContainer: ImportContainer,
    baseFqName: string
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

    const rtType =
      returnType?.type && returnType.dataType !== DataTypes.PrimitiveType
        ? importContainer.addGeneratedModel(returnType.fqType, returnType.type)
        : returnType?.type;
    const paramsModelName = hasParams
      ? importContainer.addGeneratedModel(baseFqName, operation.paramsModelName)
      : undefined;
    const qOperationName = importContainer.addGeneratedQObject(baseFqName, operation.qName);

    const qOpProp = "this." + this.namingHelper.getPrivatePropName(operation.qName);

    return {
      scope: Scope.Public,
      isAsync: true,
      name,
      parameters: hasParams ? [{ name: "params", type: paramsModelName }, requestConfigParam] : [requestConfigParam],
      returnType: `ODataResponse<${odataType}<${rtType || "void"}>>`,
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
}
