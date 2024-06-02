import { MappedConverterChains } from "@odata2ts/converter-runtime";
import { ODataTypesV2, ODataTypesV4 } from "@odata2ts/odata-core";

import {
  ActionImportType,
  ComplexType,
  DataTypes,
  EntityContainerModel,
  EntitySetType,
  EntityType,
  EnumType,
  FunctionImportType,
  ModelType,
  ODataVersion,
  OperationType,
  OperationTypes,
  PropertyModel,
  SingletonType,
} from "./DataTypeModel";
import { ValidationError } from "./validation/NameValidator";

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
  // this supports the edge case of an empty string as namespace which isn't really valid according to spec (see CSDL)
  return ns ? `${ns}.${name}` : name;
}

export class DataModel {
  private readonly converters: MappedConverterChains;
  private nameValidation: Map<string, ValidationError[]> | undefined;

  private models = new Map<string, EntityType | ComplexType | EnumType>();
  /**
   * Stores unbound operations by their fully qualified name.
   * @private
   */
  private unboundOperationTypes = new Map<string, OperationType>();
  /**
   * Stores operations bound to an entity type by the fully qualified name of the binding entity, e.g.
   * "Trippin.Person".
   * @private
   */
  private entityBoundOperationTypes = new Map<string, Array<OperationType>>();
  /**
   * Stores operations bound to an entity collection by the fully qualified name of the binding entity, e.g.
   * "Trippin.Person".
   * @private
   */
  private entityCollectionBoundOperationTypes = new Map<string, Array<OperationType>>();
  /**
   * Stores own type definitions which map to primitive types.
   * @private
   */
  private typeDefinitions = new Map<string, string>();
  private readonly namespace2Alias: { [ns: string]: string };
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

  private retrieveType<T>(fqName: string, haystack: Map<string, T>): T | undefined {
    return haystack.get(fqName) || (this.aliases[fqName] ? haystack.get(this.aliases[fqName]) : undefined);
  }

  private addAlias(namespace: string, name: string) {
    const alias = this.namespace2Alias[namespace];
    if (alias) {
      this.aliases[withNamespace(alias, name)] = withNamespace(namespace, name);
    }
  }

  public addTypeDefinition(namespace: string, name: string, type: string) {
    const fqName = withNamespace(namespace, name);
    this.typeDefinitions.set(fqName, type);
    this.addAlias(namespace, name);
  }

  public getPrimitiveType(fqName: string): string | undefined {
    return this.retrieveType(fqName, this.typeDefinitions);
  }

  public getModel(fqName: string) {
    return this.retrieveType(fqName, this.models);
  }

  public getModelTypes(): Array<ModelType> {
    return [...this.models.values()];
  }

  public addEntityType(namespace: string, name: string, model: Omit<EntityType, "dataType">) {
    const fqName = withNamespace(namespace, name);

    this.models.set(fqName, { ...model, dataType: DataTypes.ModelType });
    this.addAlias(namespace, name);
  }

  /**
   * Get a specific model by its fully qualified name.
   *
   * @param fqName the fully qualified name of the entity
   * @returns the model type
   */
  public getEntityType(fqName: string) {
    return this.retrieveType(fqName, this.models) as EntityType;
  }

  /**
   * Retrieve all known EntityType models from the EDMX model.
   *
   * @returns list of model types
   */
  public getEntityTypes() {
    const ets = [...this.models.values()].filter((m): m is EntityType => m.dataType === DataTypes.ModelType);
    return this.sortModelsByInheritance(ets);
  }

  public addComplexType(namespace: string, name: string, model: Omit<ComplexType, "dataType">) {
    const fqName = withNamespace(namespace, name);

    this.models.set(fqName, { ...model, dataType: DataTypes.ComplexType });
    this.addAlias(namespace, name);
  }

  /**
   * Get a specific model by its fully qualified name.
   *
   * @param fqName the final model name that is generated
   * @returns the model type
   */
  public getComplexType(fqName: string) {
    return this.retrieveType(fqName, this.models) as ComplexType;
  }

  /**
   * Retrieve all known ComplexType models from the EDMX model.
   *
   * @returns list of model types
   */
  public getComplexTypes() {
    const types = [...this.models.values()].filter((m): m is ComplexType => m.dataType === DataTypes.ComplexType);
    return this.sortModelsByInheritance(types);
  }

  public addEnum(namespace: string, name: string, type: Omit<EnumType, "dataType">) {
    const fqName = withNamespace(namespace, name);

    this.models.set(fqName, { ...type, dataType: DataTypes.EnumType });
    this.addAlias(namespace, name);
  }

  /**
   * Get list of all known enums, i.e. EnumType nodes from the EDMX model.
   * @returns list of enum types
   */
  public getEnums() {
    return [...this.models.values()].filter((m): m is EnumType => m.dataType === DataTypes.EnumType);
  }

  public addUnboundOperationType(namespace: string, operationType: OperationType) {
    // supporting function overrides
    const isFunction = operationType.type === OperationTypes.Function;
    const existingFn = isFunction ? this.unboundOperationTypes.get(operationType.fqName) : undefined;
    if (existingFn) {
      const params = operationType.parameters;
      existingFn.overrides ? existingFn.overrides.push(params) : (existingFn.overrides = [params]);
      return;
    }

    this.unboundOperationTypes.set(operationType.fqName, operationType);
    this.addAlias(namespace, operationType.odataName);
  }

  public getUnboundOperationTypes(): Array<OperationType> {
    return [...this.unboundOperationTypes.values()];
  }

  public getUnboundOperationType(fqOpName: string): OperationType | undefined {
    return this.retrieveType(fqOpName, this.unboundOperationTypes);
  }

  public addBoundOperationType(namespace: string, bindingProp: PropertyModel, operationType: OperationType) {
    const fqEntityType = bindingProp.fqType;
    const store = bindingProp.isCollection ? this.entityCollectionBoundOperationTypes : this.entityBoundOperationTypes;
    const boundOps = store.get(fqEntityType);

    if (boundOps) {
      // supporting function overrides
      const isFunction = operationType.type === OperationTypes.Function;
      const existingFn = isFunction ? boundOps.find((bo) => bo.fqName === operationType.fqName) : undefined;
      if (existingFn) {
        const params = operationType.parameters;
        existingFn.overrides ? existingFn.overrides.push(params) : (existingFn.overrides = [params]);
      } else {
        boundOps.push(operationType);
      }
    } else {
      store.set(fqEntityType, [operationType]);
    }
  }

  public getEntityTypeOperations(fqEntityName: string): Array<OperationType> {
    const operations = this.retrieveType(fqEntityName, this.entityBoundOperationTypes);
    return operations || [];
  }

  public getEntitySetOperations(fqEntityName: string): Array<OperationType> {
    const operations = this.retrieveType(fqEntityName, this.entityCollectionBoundOperationTypes);
    return operations || [];
  }

  public getAllEntityOperations(fqEntityName: string): Array<OperationType> {
    return [...this.getEntityTypeOperations(fqEntityName), ...this.getEntitySetOperations(fqEntityName)];
  }

  public addAction(fqName: string, action: ActionImportType) {
    this.container.actions[fqName] = action;
  }

  public addFunction(fqName: string, func: FunctionImportType) {
    this.container.functions[fqName] = func;
  }

  public addSingleton(fqName: string, singleton: SingletonType) {
    this.container.singletons[fqName] = singleton;
  }

  public addEntitySet(fqName: string, entitySet: EntitySetType) {
    this.container.entitySets[fqName] = entitySet;
  }

  public getEntityContainer() {
    return this.container;
  }

  public getConverter(dataType: ODataTypesV2 | ODataTypesV4 | string) {
    return this.converters.get(dataType);
  }

  private sortModelsByInheritance<Type extends Omit<ComplexType, "dataType">>(models: Array<Type>): Array<Type> {
    // recursively visit all models and sort them by inheritance such that base classes
    // are always before derived classes
    const sorted: Array<Type> = [];
    const visitedModels = new Set<string>();
    const inProgressModels = new Set<string>();

    function visit(model: Type) {
      const fqName = model.fqName;
      if (inProgressModels.has(fqName)) {
        throw new Error(`Cyclic inheritance detected for model "${fqName}"!`);
      }

      if (!visitedModels.has(fqName)) {
        inProgressModels.add(fqName);

        for (const baseClassName of model.baseClasses) {
          const baseClass = models.find((e) => e.fqName === baseClassName);
          if (baseClass) {
            visit(baseClass);
          }
        }
        visitedModels.add(fqName);
        inProgressModels.delete(fqName);
        sorted.push(model);
      }
    }

    for (const model of models) {
      visit(model);
    }
    return sorted;
  }

  public setNameValidation(map: Map<string, ValidationError[]>) {
    this.nameValidation = map;
  }

  public getNameValidation() {
    return this.nameValidation!;
  }
}
