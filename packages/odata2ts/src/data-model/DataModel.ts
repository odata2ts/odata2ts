import { MappedConverterChains } from "@odata2ts/converter-runtime";
import { ODataTypesV2, ODataTypesV4 } from "@odata2ts/odata-core";

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
  PropertyModel,
  SingletonType,
} from "./DataTypeModel";

export interface ProjectFiles {
  model: string;
  qObject: string;
  service: string;
}

export type NamespaceWithAlias = [string, string?];

export function withNamespace(ns: string, name: string) {
  return `${ns}.${name}`;
}

export class DataModel {
  private readonly converters: MappedConverterChains;

  private modelTypes: { [fqName: string]: ModelType } = {};
  private complexTypes: { [fqName: string]: ComplexType } = {};
  private enumTypes: { [fqName: string]: EnumType } = {};
  private operationTypes: { [fqName: string]: OperationType } = {};
  private unboundOperationTypes = new Set<string>();
  private boundOperationTypes: { [entityFqName: string]: Array<string> } = {};
  private rootOpNamespaces = new Set<string>();
  private typeDefinitions: { [fqName: string]: string } = {};
  private container: EntityContainerModel = { entitySets: {}, singletons: {}, functions: {}, actions: {} };

  constructor(private version: ODataVersion, converters: MappedConverterChains = new Map()) {
    this.converters = converters;
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

  public addTypeDefinition(name: string, type: string) {
    this.typeDefinitions[name] = type;
  }

  public getPrimitiveType(name: string): string | undefined {
    return this.typeDefinitions[name];
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
   * Retrieve all known EntityType models from the EDMX model.
   *
   * @returns list of model types
   */
  public getModels() {
    return Object.values(this.modelTypes);
  }

  /**
   * Set all model entity types
   *
   * @param models new model types
   */
  public setModels(models: { [name: string]: ModelType }) {
    this.modelTypes = models;
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
   * Retrieve all known ComplexType models from the EDMX model.
   *
   * @returns list of model types
   */
  public getComplexTypes() {
    return Object.values(this.complexTypes);
  }

  /**
   * Set all complex types
   *
   * @param complexTypes new complex types
   */
  public setComplexTypes(complexTypes: { [name: string]: ComplexType }) {
    this.complexTypes = complexTypes;
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

  private addOp(operationType: OperationType) {
    this.operationTypes[operationType.fqName] = operationType;
  }

  public getOperationType(fqOpName: string) {
    return this.operationTypes[fqOpName];
  }

  public addUnboundOperationType(operationType: OperationType) {
    this.addOp(operationType);
    this.unboundOperationTypes.add(operationType.fqName);
  }

  public getUnboundOperationTypes(): Array<OperationType> {
    return [...this.unboundOperationTypes].map((fqName) => this.operationTypes[fqName]);
  }

  public addBoundOperationType(bindingProp: PropertyModel, operationType: OperationType) {
    const entityType = bindingProp.fqType;
    const binding = bindingProp.isCollection ? `Collection(${entityType})` : entityType;

    this.addOp(operationType);
    if (!this.boundOperationTypes[binding]) {
      this.boundOperationTypes[binding] = [];
    }
    this.boundOperationTypes[binding].push(operationType.fqName);
  }

  public getEntityTypeOperations(fqEntityName: string): Array<OperationType> {
    const operations = this.boundOperationTypes[fqEntityName];
    return !operations ? [] : operations.map((op) => this.operationTypes[op]);
  }

  public getEntitySetOperations(fqEntityName: string): Array<OperationType> {
    return this.getEntityTypeOperations(`Collection(${fqEntityName})`);
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

  public getConverter(dataType: ODataTypesV2 | ODataTypesV4 | string) {
    return this.converters.get(dataType);
  }
}
