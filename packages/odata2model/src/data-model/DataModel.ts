import { pascalCase } from "pascal-case";

import {
  ActionImportType,
  ComplexType,
  EntityContainerModel,
  EntitySetType,
  EnumType,
  FunctionImportType,
  ModelType,
  ODataVersion,
  OperationType,
  SingletonType,
} from "./DataTypeModel";

export interface ProjectFiles {
  model: string;
  qObject: string;
  service: string;
}

const ROOT_OPERATION_BINDING = "/";

export class DataModel {
  private readonly servicePrefix: string;
  private readonly fileNames: ProjectFiles;

  private modelTypes: { [name: string]: ModelType } = {};
  private complexTypes: { [name: string]: ComplexType } = {};
  private enumTypes: { [name: string]: EnumType } = {};
  // combines functions & actions
  private operationTypes: { [binding: string]: Array<OperationType> } = {};
  private container: EntityContainerModel = { entitySets: {}, singletons: {}, functions: {}, actions: {} };

  constructor(private version: ODataVersion, private serviceName: string, overridingServiceName?: string) {
    this.servicePrefix = serviceName + ".";

    const name = pascalCase(overridingServiceName || serviceName);
    this.fileNames = {
      model: `${name}Model`,
      qObject: `Q${name}`,
      service: `${name}${name.endsWith("Service") ? "" : "Service"}`,
    };
  }

  /**
   * OData version: 2.0 or 4.0.
   * @returns
   */
  public getODataVersion() {
    return this.version;
  }

  public isV2() {
    return this.version === ODataVersion.V2;
  }

  public isV4() {
    return this.version === ODataVersion.V4;
  }

  /**
   * The service name.
   * @returns
   */
  public getServiceName() {
    return this.serviceName;
  }

  /**
   * The prefix used to reference model or enum types in this schema.
   * @returns service prefix
   */
  public getServicePrefix() {
    return this.servicePrefix;
  }

  public getFileNames() {
    return { ...this.fileNames };
  }

  public getEditableModelName(modelName: string) {
    return `Editable${modelName}`;
  }

  public addModel(name: string, model: ModelType) {
    this.modelTypes[name] = model;
  }

  /**
   * Get a specific model by its name.
   *
   * @param modelName the final model name that is generated
   * @returns the model type
   */
  public getModel(modelName: string) {
    return this.modelTypes[modelName];
  }

  /**
   * Retrieve all known models, i.e. EntityType and ComplexType nodes from the EDMX model.
   *
   * @returns list of model types
   */
  public getModels() {
    return Object.values(this.modelTypes);
  }

  public addComplexType(name: string, model: ComplexType) {
    this.complexTypes[name] = model;
  }

  /**
   * Get a specific model by its name.
   *
   * @param name the final model name that is generated
   * @returns the model type
   */
  public getComplexType(name: string) {
    return this.complexTypes[name];
  }

  /**
   * Retrieve all known models, i.e. EntityType and ComplexType nodes from the EDMX model.
   *
   * @returns list of model types
   */
  public getComplexTypes() {
    return Object.values(this.complexTypes);
  }

  public addEnum(name: string, type: EnumType) {
    this.enumTypes[name] = type;
  }

  /**
   * Get list of all known enums, i.e. EnumType nodes from the EDMX model.
   * @returns list of enum types
   */
  public getEnums() {
    return Object.values(this.enumTypes);
  }

  public addOperationType(binding: string, operationType: OperationType) {
    if (!this.operationTypes[binding]) {
      this.operationTypes[binding] = [];
    }

    this.operationTypes[binding].push(operationType);
  }

  public getUnboundOperationTypes(): Array<OperationType> {
    const operations = this.operationTypes[ROOT_OPERATION_BINDING];
    return !operations ? [] : [...operations];
  }

  public getOperationTypeByBinding(binding: string): Array<OperationType> {
    const operations = this.operationTypes[binding];
    return !operations ? [] : [...operations];
  }

  public addAction(name: string, action: ActionImportType) {
    this.container.actions[name] = action;
  }

  public addFunction(name: string, func: FunctionImportType) {
    this.container.functions[name] = func;
  }

  public addSingleton(name: string, singleton: SingletonType) {
    this.container.singletons[name] = singleton;
  }

  public addEntitySet(name: string, entitySet: EntitySetType) {
    this.container.entitySets[name] = entitySet;
  }

  public getEntityContainer() {
    return this.container;
  }
}
