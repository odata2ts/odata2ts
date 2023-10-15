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

/**
 * Each namespace is represented as tuple: 1. the namespace 2. the alias, if any.
 */
export type NamespaceWithAlias = [string, string?];

export function withNamespace(ns: string, name: string) {
  return `${ns}.${name}`;
}

export class DataModel {
  private readonly converters: MappedConverterChains;

  private modelTypes: { [fqName: string]: ModelType } = {};
  private complexTypes: { [fqName: string]: ComplexType } = {};
  private enumTypes: { [fqName: string]: EnumType } = {};
  /**
   * All operations are stored by their fully qualified name.
   * @private
   */
  private operationTypes: { [fqName: string]: OperationType } = {};
  /**
   * Stores the fully qualified name of those operations which are unbound.
   * @private
   */
  private unboundOperationTypes = new Set<string>();
  /**
   * Stores the fully qualified names of operations that are bound to a certain entity or entity collection.
   * @private
   */
  private boundOperationTypes: { [entityFqName: string]: Array<string> } = {};
  private readonly namespace2Alias: { [ns: string]: string };
  private typeDefinitions: { [fqName: string]: string } = {};
  private aliases: Record<string, string> = {};
  private container: EntityContainerModel = { entitySets: {}, singletons: {}, functions: {}, actions: {} };

  constructor(
    namespaces: Array<NamespaceWithAlias>,
    private version: ODataVersion,
    converters: MappedConverterChains = new Map()
  ) {
    this.converters = converters;
    this.namespace2Alias = namespaces.reduce<Record<string, string>>((col, [ns, alias]) => {
      if (alias) {
        col[ns] = alias;
      }
      return col;
    }, {});
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

  private retrieveType<T>(fqName: string, haystack: Record<string, T>): T | undefined {
    return haystack[fqName] || (this.aliases[fqName] ? haystack[this.aliases[fqName]] : undefined);
  }

  private addAlias(namespace: string, name: string) {
    const alias = this.namespace2Alias[namespace];
    if (alias) {
      this.aliases[withNamespace(alias, name)] = withNamespace(namespace, name);
    }
  }

  public addTypeDefinition(namespace: string, name: string, type: string) {
    const fqName = withNamespace(namespace, name);
    this.typeDefinitions[fqName] = type;
    this.addAlias(namespace, name);
  }

  public getPrimitiveType(fqName: string): string | undefined {
    return this.retrieveType(fqName, this.typeDefinitions);
  }

  public addModel(namespace: string, name: string, model: ModelType) {
    const fqName = withNamespace(namespace, name);
    this.modelTypes[fqName] = model;
    this.addAlias(namespace, name);
  }

  /**
   * Get a specific model by its fully qualified name.
   *
   * @param fqName the fully qualified name of the entity
   * @returns the model type
   */
  public getModel(fqName: string) {
    return this.retrieveType(fqName, this.modelTypes);
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

  public addComplexType(namespace: string, name: string, model: ComplexType) {
    const fqName = withNamespace(namespace, name);
    this.complexTypes[fqName] = model;
    this.addAlias(namespace, name);
  }

  /**
   * Get a specific model by its fully qualified name.
   *
   * @param fqName the final model name that is generated
   * @returns the model type
   */
  public getComplexType(fqName: string) {
    return this.retrieveType(fqName, this.complexTypes);
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

  public addEnum(namespace: string, name: string, type: EnumType) {
    const fqName = withNamespace(namespace, name);
    this.enumTypes[fqName] = type;
    this.addAlias(namespace, name);
  }

  /**
   * Get list of all known enums, i.e. EnumType nodes from the EDMX model.
   * @returns list of enum types
   */
  public getEnums() {
    return Object.values(this.enumTypes);
  }

  private addOp(namespace: string, operationType: OperationType) {
    this.operationTypes[operationType.fqName] = operationType;
    this.addAlias(namespace, operationType.odataName);
  }

  public getOperationType(fqOpName: string) {
    return this.retrieveType(fqOpName, this.operationTypes);
  }

  public addUnboundOperationType(namespace: string, operationType: OperationType) {
    this.addOp(namespace, operationType);
    this.unboundOperationTypes.add(operationType.fqName);
  }

  public getUnboundOperationTypes(): Array<OperationType> {
    return [...this.unboundOperationTypes].map((fqName) => this.operationTypes[fqName]);
  }

  private addBoundOp(binding: string, opFqName: string) {
    if (!this.boundOperationTypes[binding]) {
      this.boundOperationTypes[binding] = [];
    }
    this.boundOperationTypes[binding].push(opFqName);
  }

  public addBoundOperationType(namespace: string, bindingProp: PropertyModel, operationType: OperationType) {
    const entityType = bindingProp.fqType;
    const binding = bindingProp.isCollection ? `Collection(${entityType})` : entityType;

    this.addOp(namespace, operationType);
    this.addBoundOp(binding, operationType.fqName);

    const ns = Object.keys(this.namespace2Alias).find((ns) => entityType.startsWith(ns + "."));
    if (ns) {
      const aliasType = entityType.replace(new RegExp(`^${ns}\.`), this.namespace2Alias[ns] + ".");
      const aliasBinding = bindingProp.isCollection ? `Collection(${aliasType})` : aliasType;
      this.addBoundOp(aliasBinding, operationType.fqName);
    }
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
