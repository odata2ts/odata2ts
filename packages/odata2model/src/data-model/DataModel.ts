import { upperCaseFirst } from "upper-case-first";
import {
  ModelType,
  EnumType,
  EntityContainerModel,
  OperationType,
  ActionImportType,
  FunctionImportType,
  SingletonType,
  EntitySetType,
} from "./DataTypeModel";

export interface ProjectFiles {
  model: string;
  qObject: string;
  service: string;
}

export class DataModel {
  private servicePrefix: string;
  private fileNames: ProjectFiles;

  // combines entity & complex types
  private modelTypes: { [name: string]: ModelType } = {};
  private enumTypes: { [name: string]: EnumType } = {};
  // combines functions & actions
  private operationTypes: { [binding: string]: Array<OperationType> } = {};
  private container: EntityContainerModel = { entitySets: {}, singletons: {}, functions: {}, actions: {} };

  // imports of custom dataTypes which are represented at strings,
  // e.g. DateString, GuidString, etc.
  private primitiveTypeImports: Set<string> = new Set();

  constructor(private serviceName: string) {
    this.servicePrefix = serviceName + ".";

    const name = upperCaseFirst(serviceName);
    this.fileNames = {
      model: `${name}Model`,
      qObject: `Q${name}`,
      service: `${name}${name.endsWith("Service") ? "" : "Service"}`,
    };
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

  public addEnum(name: string, type: EnumType) {
    this.enumTypes[name] = type;
  }

  /**
   * Get a specific enum by its name.
   *
   * @param name the final enum name that is generated
   * @returns enum type
   */
  public getEnum(name: string) {
    return this.enumTypes[name];
  }

  /**
   * Get list of all known enums, i.e. EnumType nodes from the EDMX model.
   * @returns list of enum types
   */
  public getEnums() {
    return Object.values(this.enumTypes);
  }

  public addPrimitiveTypeImport(typeName: string) {
    this.primitiveTypeImports.add(typeName);
  }

  /**
   * Get all special primitive data types, i.e. data types which are represented at strings,
   * but convey a specific meaning: DateString, GuidString, etc.
   *
   * @returns list of additional data types to import when working with the data model
   */
  public getPrimitiveTypeImports(): Array<string> {
    return [...this.primitiveTypeImports];
  }

  public addOperationType(binding: string, operationType: OperationType) {
    if (!this.operationTypes[binding]) {
      this.operationTypes[binding] = [];
    }

    this.operationTypes[binding].push(operationType);
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
