import { MethodDeclarationStructure, OptionalKind, PropertyDeclarationStructure, Scope, SourceFile } from "ts-morph";
import { upperCaseFirst } from "upper-case-first";
import { firstCharLowerCase } from "xml2js/lib/processors";

import { ODataVesions } from "../app";
import { DataModel } from "../data-model/DataModel";
import {
  ActionImportType,
  ComplexType,
  DataTypes,
  EntitySetType,
  FunctionImportType,
  ModelType,
  OperationType,
  OperationTypes,
  PropertyModel,
  SingletonType,
} from "../data-model/DataTypeModel";
import { ProjectManager } from "../project/ProjectManager";
import { ImportContainer } from "./ImportContainer";
import {
  getCollectionServiceName,
  getGetterNameForService,
  getPrivateGetterName,
  getPrivatePropName,
  getPropNameForService,
  getServiceName,
  getServiceNameForProp,
  getServiceNamesForProp,
} from "./ServiceNamingHelper";

const ROOT_SERVICE = "ODataService";

const RESPONSE_TYPES = {
  collection: "ODataCollectionResponse",
  model: "ODataModelResponse",
  value: "ODataValueResponse",
};

export async function generateServices(dataModel: DataModel, project: ProjectManager, version: ODataVesions) {
  const generator = new ServiceGenerator(dataModel, project, version);
  return generator.generate();
}

class ServiceGenerator {
  constructor(private dataModel: DataModel, private project: ProjectManager, private version: ODataVesions) {}

  public async generate(): Promise<void> {
    const sourceFile = await this.project.createMainServiceFile();
    const serviceName = this.dataModel.getFileNames().service;
    const container = this.dataModel.getEntityContainer();
    const unboundOperations = [...Object.values(container.functions), ...Object.values(container.actions)];

    await this.generateModelServices();

    const importContainer = new ImportContainer(this.dataModel);
    importContainer.addFromClientApi("ODataClient");
    importContainer.addFromService(ROOT_SERVICE);

    sourceFile.addClass({
      isExported: true,
      name: serviceName,
      typeParameters: ["ClientType extends ODataClient"],
      extends: `${ROOT_SERVICE}<ClientType>`,
      properties: [
        { scope: Scope.Private, name: "_name", type: "string", initializer: `"${this.dataModel.getServiceName()}"` },
        ...this.generateServiceTypeProps(container.entitySets, getCollectionServiceName, importContainer),
        ...this.generateServiceTypeProps(container.singletons, getServiceName, importContainer),
        ...Object.values(unboundOperations).map(({ operation }) => this.generateQOperationProps(operation)),
      ],
      methods: [
        ...this.generateServiceTypeGetters(container.entitySets, getCollectionServiceName),
        ...this.generateServiceTypeGetters(container.singletons, getServiceName),
        ...this.generateUnboundOperations(unboundOperations, importContainer),
      ],
    });

    sourceFile.addImportDeclarations(importContainer.getImportDeclarations(false));
  }

  private generateServiceTypeProps(
    services: Record<string, SingletonType | EntitySetType>,
    typeRetriever: (name: string) => string,
    importContainer: ImportContainer
  ): OptionalKind<PropertyDeclarationStructure>[] {
    return Object.values(services).map(({ name, entityType }) => {
      const type = typeRetriever(entityType.name);

      importContainer.addGeneratedService(getServiceName(entityType.name), type);

      return {
        scope: Scope.Private,
        name: getPropNameForService(name),
        type: `${type}<ClientType>`,
        hasQuestionToken: true,
      };
    });
  }

  private generateQOperationProps(operation: OperationType) {
    return {
      scope: Scope.Private,
      name: getPrivatePropName(operation.qName),
      type: operation.qName,
      hasQuestionToken: true,
    };
  }

  private generateServiceTypeGetters(
    services: Record<string, SingletonType | EntitySetType>,
    typeRetriever: (name: string) => string
  ): OptionalKind<MethodDeclarationStructure>[] {
    return Object.values(services).map(({ name, odataName, entityType }) => {
      const propName = getPropNameForService(name);
      const serviceType = typeRetriever(entityType.name);
      return {
        scope: Scope.Public,
        name: getGetterNameForService(name),
        statements: [
          `if(!this.${propName}) {`,
          // prettier-ignore
          `  this.${propName} = new ${serviceType}(this.client, this.getPath(), "${odataName}")`,
          "}",
          `return this.${propName}`,
        ],
      };
    });
  }

  private getVersionSuffix() {
    return this.version === ODataVesions.V2 ? "V2" : "V4";
  }

  private async generateModelService(
    model: ComplexType,
    serviceName: string,
    serviceFile: SourceFile,
    importContainer: ImportContainer
  ) {
    const entityServiceType = "EntityTypeService" + this.getVersionSuffix();
    const collectionServiceType = "CollectionService" + this.getVersionSuffix();

    const editableModelName = this.dataModel.getEditableModelName(model.name);
    const operations = this.dataModel.getOperationTypeByBinding(model.name);
    const props = [...model.baseProps, ...model.props];
    const modelProps = props.filter(
      (prop) => prop.dataType === DataTypes.ModelType || prop.dataType === DataTypes.ComplexType
    );
    const primColProps = props.filter(
      (prop) => prop.isCollection && prop.dataType !== DataTypes.ModelType && prop.dataType !== DataTypes.ComplexType
    );

    importContainer.addFromService(entityServiceType);
    importContainer.addFromClientApi("ODataClient");
    importContainer.addGeneratedModel(model.name, editableModelName);
    importContainer.addGeneratedQObject(model.qName, firstCharLowerCase(model.qName));

    // generate EntityTypeService
    serviceFile.addClass({
      isExported: true,
      name: serviceName,
      typeParameters: ["ClientType extends ODataClient"],
      extends: entityServiceType + `<ClientType, ${model.name}, ${editableModelName}, ${model.qName}>`,
      ctors: [
        {
          parameters: [
            { name: "client", type: "ClientType" },
            { name: "basePath", type: "string" },
            { name: "name", type: "string" },
          ],
          statements: [`super(client, basePath, name, ${firstCharLowerCase(model.qName)});`],
        },
      ],
      properties: [
        ...this.generateModelProps(modelProps, collectionServiceType, serviceName, importContainer),
        ...this.generatePrimitiveCollectionProps(primColProps, collectionServiceType, importContainer),
        ...operations.map(this.generateQOperationProps),
      ],
      methods: [
        ...this.generateModelPropGetters(modelProps, collectionServiceType),
        ...this.generatePrimitiveCollectionGetters(primColProps, collectionServiceType),
        ...this.generateBoundOperations(operations, importContainer),
      ],
    });
  }

  private generateModelProps(
    modelProps: Array<PropertyModel>,
    collectionServiceType: string,
    serviceName: string,
    importContainer: ImportContainer
  ): Array<PropertyDeclarationStructure> {
    return modelProps.map((prop) => {
      const complexType = this.dataModel.getComplexType(prop.type);
      let [key, propModelType] = getServiceNamesForProp(prop);

      if (prop.isCollection && complexType) {
        const editableName = this.dataModel.getEditableModelName(complexType.name);
        importContainer.addFromService(collectionServiceType);
        importContainer.addGeneratedModel(complexType.name, editableName);
        importContainer.addGeneratedQObject(complexType.qName, firstCharLowerCase(complexType.qName));
        propModelType = `${collectionServiceType}<ClientType, ${complexType.name}, ${complexType.qName}, ${editableName}>`;
      } else {
        // don't include imports for this type
        if (serviceName !== key) {
          importContainer.addGeneratedService(key, propModelType);
        }

        propModelType = `${propModelType}<ClientType>`;
      }

      return {
        scope: Scope.Private,
        name: getPropNameForService(prop.name),
        type: propModelType,
        hasQuestionToken: true,
      } as PropertyDeclarationStructure;
    });
  }

  private generatePrimitiveCollectionProps(
    primColProps: Array<PropertyModel>,
    collectionServiceType: string,
    importContainer: ImportContainer
  ): Array<PropertyDeclarationStructure> {
    return primColProps.map((prop) => {
      const isEnum = prop.dataType === DataTypes.EnumType;
      const type = isEnum ? `EnumCollection<${prop.type}>` : `${upperCaseFirst(prop.type)}Collection`;
      const qType = isEnum ? "QEnumCollection" : `Q${type}`;
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
        name: getPropNameForService(prop.name),
        type: `${collectionType}`,
        hasQuestionToken: true,
      } as PropertyDeclarationStructure;
    });
  }

  private generateModelPropGetters(
    modelProps: Array<PropertyModel>,
    collectionServiceType: string
  ): Array<MethodDeclarationStructure> {
    return modelProps.map((prop) => {
      const propName = getPropNameForService(prop.name);
      const complexType = this.dataModel.getComplexType(prop.type);
      const isComplexCollection = prop.isCollection && complexType;
      const type = isComplexCollection ? collectionServiceType : getServiceNameForProp(prop);
      const typeWithGenerics = isComplexCollection
        ? `${collectionServiceType}<ClientType, ${complexType.name}, ${
            complexType.qName
          }, ${this.dataModel.getEditableModelName(complexType.name)}>`
        : `${type}<ClientType>`;

      return {
        scope: Scope.Public,
        name: getGetterNameForService(prop.name),
        returnType: typeWithGenerics,
        statements: [
          `if(!this.${propName}) {`,
          // prettier-ignore
          `  this.${propName} = new ${type}(this.client, this.getPath(), "${prop.odataName}"${isComplexCollection ? `, ${firstCharLowerCase(complexType.qName)}`: ""})`,
          "}",
          `return this.${propName}`,
        ],
      } as MethodDeclarationStructure;
    });
  }

  private generatePrimitiveCollectionGetters(
    primColProps: Array<PropertyModel>,
    collectionServiceType: string
  ): Array<MethodDeclarationStructure> {
    return primColProps.map((prop) => {
      const propName = getPropNameForService(prop.name);
      return {
        scope: Scope.Public,
        name: getGetterNameForService(prop.name),
        statements: [
          `if(!this.${propName}) {`,
          // prettier-ignore
          `  this.${propName} = new ${collectionServiceType}(this.client, this.getPath(), "${prop.odataName}", ${firstCharLowerCase(prop.qObject!)})`,
          "}",
          `return this.${propName}`,
        ],
      } as MethodDeclarationStructure;
    });
  }

  private async generateEntityCollectionService(
    model: ModelType,
    serviceName: string,
    serviceFile: SourceFile,
    importContainer: ImportContainer
  ) {
    const entitySetServiceType = "EntitySetService" + this.getVersionSuffix();
    const editableModelName = this.dataModel.getEditableModelName(model.name);
    const qObjectName = firstCharLowerCase(model.qName);

    importContainer.addFromService(entitySetServiceType);
    importContainer.addGeneratedModel(model.idModelName);
    importContainer.addGeneratedQObject(model.qIdFunctionName);

    const collectionOperations = this.dataModel.getOperationTypeByBinding(`Collection(${model.name})`);

    serviceFile.addClass({
      isExported: true,
      name: getCollectionServiceName(model.name),
      typeParameters: ["ClientType extends ODataClient"],
      extends:
        entitySetServiceType +
        `<ClientType, ${model.name}, ${editableModelName}, ${model.qName}, ${model.idModelName}, ${serviceName}<ClientType>>`,
      ctors: [
        {
          parameters: [
            { name: "client", type: "ClientType" },
            { name: "basePath", type: "string" },
            { name: "name", type: "string" },
          ],
          statements: [
            `super(client, basePath, name, ${qObjectName}, ${serviceName}, new ${model.qIdFunctionName}(name));`,
          ],
        },
      ],
      properties: [...collectionOperations.map(this.generateQOperationProps)],
      methods: [...this.generateBoundOperations(collectionOperations, importContainer)],
    });
  }

  private async generateModelServices() {
    // build service file for each entity, consisting of EntityTypeService & EntityCollectionService
    for (const model of this.dataModel.getModels()) {
      const serviceName = getServiceName(model.name);
      const serviceFile = await this.project.createServiceFile(serviceName);
      const importContainer = new ImportContainer(this.dataModel);

      // entity type service
      await this.generateModelService(model, serviceName, serviceFile, importContainer);

      // entity collection service
      await this.generateEntityCollectionService(model, serviceName, serviceFile, importContainer);

      serviceFile.addImportDeclarations(importContainer.getImportDeclarations(true));
    }

    // build service file for complex types
    for (const model of this.dataModel.getComplexTypes()) {
      const serviceName = getServiceName(model.name);
      const serviceFile = await this.project.createServiceFile(serviceName);
      const importContainer = new ImportContainer(this.dataModel);

      // entity type service
      await this.generateModelService(model, serviceName, serviceFile, importContainer);
      serviceFile.addImportDeclarations(importContainer.getImportDeclarations(true));
    }
  }

  private generateBoundOperations(operations: Array<OperationType>, importContainer: ImportContainer) {
    return operations.reduce<Array<OptionalKind<MethodDeclarationStructure>>>((collector, operation) => {
      collector.push(this.generateQOperationGetter(operation));
      collector.push(this.generateMethod(operation.name, operation, importContainer));

      return collector;
    }, []);
  }

  private generateUnboundOperations(
    operations: Array<FunctionImportType | ActionImportType>,
    importContainer: ImportContainer
  ) {
    return Object.values(operations).reduce<Array<OptionalKind<MethodDeclarationStructure>>>(
      (collector, { name, operation }) => {
        collector.push(this.generateQOperationGetter(operation));
        collector.push(this.generateMethod(name, operation, importContainer));

        return collector;
      },
      []
    );
  }

  private generateQOperationGetter(operation: OperationType): OptionalKind<MethodDeclarationStructure> {
    const propName = getPrivatePropName(operation.qName);
    return {
      scope: Scope.Private,
      name: getPrivateGetterName(operation.qName),
      statements: [
        `if(!this.${propName}) {`,
        // prettier-ignore
        `  this.${propName} = new ${operation.qName}()`,
        "}",
        `return this.${propName}`,
      ],
    };
  }

  private generateMethod(
    name: string,
    operation: OperationType,
    importContainer: ImportContainer
  ): OptionalKind<MethodDeclarationStructure> {
    const isFunc = operation.type === OperationTypes.Function;
    const odataType = operation.returnType?.isCollection
      ? RESPONSE_TYPES.collection + this.getVersionSuffix()
      : RESPONSE_TYPES.model + this.getVersionSuffix();
    const returnType = !operation.returnType ? "void" : operation.returnType.type;
    const requestConfigParam = { name: "requestConfig", hasQuestionToken: true, type: "ODataClientConfig<ClientType>" };
    const hasParams = operation.parameters.length > 0;

    // importing dependencies
    importContainer.addFromClientApi("ODataClientConfig", "ODataResponse");
    importContainer.addFromService(odataType);
    if (operation.returnType?.type && returnType) {
      if ([DataTypes.EnumType, DataTypes.ModelType, DataTypes.ComplexType].includes(operation.returnType.dataType)) {
        importContainer.addGeneratedModel(returnType);
      }
    }
    importContainer.addGeneratedQObject(operation.qName);
    if (hasParams) {
      importContainer.addGeneratedModel(operation.paramsModelName);
    }

    return {
      scope: Scope.Public,
      name,
      parameters: hasParams
        ? [{ name: "params", type: operation.paramsModelName }, requestConfigParam]
        : [requestConfigParam],
      returnType: `ODataResponse<${odataType}<${returnType}>>`,
      statements: [
        `const url = this.addFullPath(this.${getPrivateGetterName(operation.qName)}().buildUrl(${
          isFunc && hasParams ? "params" : ""
        }))`,
        `return this.client.${
          !isFunc
            ? // actions: since V4
              `post(url, ${hasParams ? "params" : "{}"}, ${requestConfigParam.name})`
            : operation.usePost
            ? // V2 POST => BUT values are still query params, they are not part of the request body
              `post(url, undefined, ${requestConfigParam.name})`
            : // functions: since V2
              `get(url, ${requestConfigParam.name})`
        };`,
      ],
    };
  }
}
