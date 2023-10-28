import { MappedConverterChains } from "@odata2ts/converter-runtime";
import { ODataTypesV2, ODataTypesV4 } from "@odata2ts/odata-core";

import {
  ActionImportType,
  ComplexType,
  DataTypes,
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
  // this supports the edge case of an empty string as namespace which isn't really valid according to spec (see CSDL)
  return ns ? `${ns}.${name}` : name;
}

export class DataModel {
  private readonly converters: MappedConverterChains;

  private models = new Map<string, ModelType | ComplexType | EnumType>();
  /**
   * All operations are stored by their fully qualified name.
   * @private
   */
  private operationTypes = new Map<string, OperationType>();
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
  private alias2boundOperationType = new Map<string, string>();
  private readonly namespace2Alias: { [ns: string]: string };
  private typeDefinitions = new Map<string, string>();
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

  public addEntityType(namespace: string, name: string, model: Omit<ModelType, "dataType">) {
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
    return this.retrieveType(fqName, this.models) as ModelType;
  }

  /**
   * Retrieve all known EntityType models from the EDMX model.
   *
   * @returns list of model types
   */
  public getEntityTypes() {
    const ets = [...this.models.values()].filter((m): m is ModelType => m.dataType === DataTypes.ModelType);
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

  private addOp(namespace: string, operationType: OperationType) {
    this.operationTypes.set(operationType.fqName, operationType);
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
    return [...this.unboundOperationTypes].map((fqName) => this.operationTypes.get(fqName)!);
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
      const aliasBinding = binding.replace(new RegExp(`(.*)${ns}\.(.+)`), `$1${this.namespace2Alias[ns]}.$2`);
      this.alias2boundOperationType.set(aliasBinding, binding);
    }
  }

  public getEntityTypeOperations(fqEntityName: string): Array<OperationType> {
    const aliasBinding = this.alias2boundOperationType.get(fqEntityName);
    const operations = this.boundOperationTypes[aliasBinding || fqEntityName];
    return !operations ? [] : operations.map((op) => this.operationTypes.get(op)!);
  }

  public getEntitySetOperations(fqEntityName: string): Array<OperationType> {
    const binding = `Collection(${fqEntityName})`;
    const aliasBinding = this.alias2boundOperationType.get(binding);
    return this.getEntityTypeOperations(aliasBinding || binding);
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
}
