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
} from "./DataTypeModel.js";
import { ValidationError } from "./validation/NameValidator.js";

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
  /** `namespace2Alias`'s own keys, longest first, so a namespace nested inside another aliased one resolves against the more specific match - see {@link getDisplayFqName}. */
  private readonly aliasedNamespacesLongestFirst: Array<string>;
  private aliases: Record<string, string> = {};
  private container: EntityContainerModel = { entitySets: {}, singletons: {}, functions: {}, actions: {} };
  private navPropBindings?: Map<string, EntitySetType>;

  constructor(
    namespaces: Array<NamespaceWithAlias>,
    private version: ODataVersion,
    converters: MappedConverterChains = new Map(),
  ) {
    this.converters = converters;
    this.namespace2Alias = namespaces.reduce<Record<string, string>>((col, [ns, alias]) => {
      // `alias !== undefined`, not truthy: an explicitly configured `alias: ""` (see `NamespaceOptions`,
      // NamespaceAliasResolver) is a deliberate way to drop a namespace's prefix entirely and must be
      // stored, not treated the same as "no alias at all" the way a plain falsy check would.
      if (alias !== undefined) {
        col[ns] = alias;
      }
      return col;
    }, {});
    this.aliasedNamespacesLongestFirst = Object.keys(this.namespace2Alias).sort((a, b) => b.length - a.length);
  }

  /**
   * The display form of a fully qualified name: an aliased namespace prefix replaced by its effective
   * alias, exactly where `namespace2Alias` carries one for it - server-declared or project-configured,
   * already blended into that one table by the time this runs (see
   * `NamespaceAliasResolver.resolveNamespaceAliases`, and how the digester feeds its result into this very
   * constructor). `fqName` itself never changes here - every internal lookup (`models`,
   * `ImportContainer.addGenerated*`, error messages) keeps keying off the real, alias-free name; this is
   * purely an output-side view over it, for a cache-key literal that must still carry the fully qualified
   * name (a subtype cast, a bound operation's own name) now written more compactly.
   */
  public getDisplayFqName(fqName: string): string {
    for (const ns of this.aliasedNamespacesLongestFirst) {
      if (fqName === ns) {
        return this.namespace2Alias[ns];
      }
      if (fqName.startsWith(ns + ".")) {
        return withNamespace(this.namespace2Alias[ns], fqName.slice(ns.length + 1));
      }
    }
    return fqName;
  }

  /**
   * The effective namespace of a fully qualified name, alone - the same alias resolution
   * {@link getDisplayFqName} applies to a whole FQN, stopping short of the local name. Used to prefix an
   * otherwise un-namespaced cache-key identifier (an entity set's or unbound operation's own name) with its
   * owning type's namespace, gated by `cacheKeys.namespace` - see `ServiceGenerator`'s cache-key emission.
   *
   * Unlike {@link getDisplayFqName}, always returns *something* to prefix with: falls back to the real,
   * un-aliased namespace (`fqName` minus its own local name) wherever none of the alias sources cover it,
   * since - here - there is always a namespace, just not always an alias for it.
   */
  public getDisplayNamespace(fqName: string): string {
    for (const ns of this.aliasedNamespacesLongestFirst) {
      if (fqName.startsWith(ns + ".")) {
        return this.namespace2Alias[ns];
      }
    }
    const lastDot = fqName.lastIndexOf(".");
    return lastDot < 0 ? fqName : fqName.slice(0, lastDot);
  }

  /**
   * `name` (an entity set's, singleton's or unbound operation's own odataName) prefixed with the
   * {@link getDisplayNamespace effective namespace} of its owning type `fqName` - the one rule
   * `cacheKeys.namespace` applies, shared by every emitter of a prefixed cache-key identifier
   * (`ServiceGenerator`'s routes, `QueryObjectGenerator`'s bindings) so the two cannot drift apart.
   *
   * The prefix alone is a pure function of the model and its aliases; *whether* a given identifier is
   * prefixed at all is a decision the generator option makes at each emission site.
   */
  public getNamespacedName(fqName: string, name: string): string {
    return `${this.getDisplayNamespace(fqName)}.${name}`;
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

  /**
   * The entity set a navigation property points to, as stated by the NavigationPropertyBinding of an
   * entity set or singleton (V4) or by the AssociationSet (V2). Knowing it is what makes a binding
   * expressible by key: the URL of the referenced entity is built from that entity set.
   *
   * Bindings are declared per entity set, while the models are generated per entity type, so a navigation
   * property realized by more than one entity set with differing targets can only be served by one of
   * them - the first one wins. A path of more than one segment (a binding declared for a navigation
   * property only reachable via a subtype cast or through an intermediate navigation property) is walked
   * segment by segment via {@link resolveNavPropBindingPathOwner} to find the type the *final* segment is
   * actually declared on, rather than being left out - both shapes occur in real, un-exotic metadata (a
   * derived-type navigation property bound by a cast-qualified path; one reached only by first following a
   * contained collection).
   *
   * Each binding is registered under the type it is actually declared for - the set's own entity type for a
   * plain, single-segment path; the type the final segment is declared on for a multi-segment path - and
   * nothing else. The lookup does the hierarchy work instead: it walks the queried type's own ancestor
   * chain, most derived first, and takes the first hit. A binding declared for a base type therefore
   * serves every subtype - the navigation property is inherited, and the subtype's service needs the
   * target exactly as the base type's does - while a subtype's own binding still wins over an inherited
   * one, because its own type is tried first. A type that neither declares nor inherits a resolved
   * binding gets none: an ancestor never borrows a more-derived set's target, since the binding is
   * declared per entity set and the ancestor's own set is the only authority for its type.
   */
  public getNavPropBindingTarget(fqEntityTypeName: string, navPropOdataName: string): EntitySetType | undefined {
    if (!this.navPropBindings) {
      this.navPropBindings = new Map();

      const entitySets = Object.values(this.container.entitySets);
      const bindingSources: Array<EntitySetType | SingletonType> = [
        ...entitySets,
        ...Object.values(this.container.singletons),
      ];

      for (const source of bindingSources) {
        for (const { path, target } of source.navPropBinding ?? []) {
          const segments = path.split("/");
          const propName = segments[segments.length - 1];
          const owner =
            segments.length > 1
              ? this.resolveNavPropBindingPathOwner(source.entityType, segments.slice(0, -1))
              : source.entityType;
          if (!owner) {
            continue;
          }
          // the target may be stated qualified by the entity container it lives in
          const targetName = target.split("/").pop()!.split(".").pop()!;
          const targetSet = entitySets.find((es) => es.odataName === targetName);
          if (!targetSet) {
            continue;
          }

          const key = `${owner.fqName}|${propName}`;
          if (!this.navPropBindings.has(key)) {
            this.navPropBindings.set(key, targetSet);
          }
        }
      }
    }

    // an unknown type has no chain to walk: the direct lookup is all that can be tried
    const queriedType = this.getEntityType(fqEntityTypeName);
    const lookupChain = queriedType ? this.collectTypeHierarchy(queriedType) : [fqEntityTypeName];
    for (const typeFqName of lookupChain) {
      const hit = this.navPropBindings.get(`${typeFqName}|${navPropOdataName}`);
      if (hit) {
        return hit;
      }
    }
    return undefined;
  }

  /**
   * Walks a `NavigationPropertyBinding`/`AssociationSet` path's leading segments - everything before the
   * navigation property the binding actually names - starting from the binding's own owning entity type,
   * to find what type that final property is declared on.
   *
   * Each segment is either a navigation property's own OData name (a path through an intermediate hop,
   * e.g. `Chapters/up_`, where `up_` is declared on whatever entity type `Chapters` itself navigates to -
   * almost always, as here, a contained one, since only a contained collection has no entity set of its own
   * to be bound directly) or a type name (a cast, e.g. `Book/Publisher`, where `Publisher` is declared only
   * on the `Book` subtype). A segment is looked up as a property of the current type *first* - not by
   * checking for a namespace-qualifying "." - because `NamingHelper.stripServicePrefix` already strips a
   * cast segment down to its bare local name wherever its namespace matches the digester's own main
   * namespace (the common case, confirmed against int-test/asp-net's real, digested metadata), so a cast
   * segment reaching here is indistinguishable from a property name by shape alone; only once the property
   * lookup fails is the segment tried as a type name, both fully qualified (a namespace the stripping left
   * alone) and by its own bare local name (the stripped, common case).
   */
  private resolveNavPropBindingPathOwner(
    startType: EntityType,
    segments: ReadonlyArray<string>,
  ): EntityType | undefined {
    let currentType = startType;

    for (const segment of segments) {
      const prop = [...currentType.baseProps, ...currentType.props].find((p) => p.odataName === segment);
      if (prop) {
        if (prop.dataType !== DataTypes.ModelType) {
          return undefined;
        }
        const targetType = this.getEntityType(prop.fqType);
        if (!targetType) {
          return undefined;
        }
        currentType = targetType;
        continue;
      }

      const castType = this.getEntityType(segment) ?? this.getEntityTypes().find((et) => et.name === segment);
      if (!castType) {
        return undefined;
      }
      currentType = castType;
    }

    return currentType;
  }

  /**
   * The fully qualified names of an entity type and of all its base types, most derived first - the order
   * {@link getNavPropBindingTarget} relies on, so a type's own binding is always tried before any
   * inherited one.
   */
  private collectTypeHierarchy(entityType: EntityType): Array<string> {
    const result: Array<string> = [];
    const visited = new Set<string>();
    const queue: Array<string> = [entityType.fqName];

    while (queue.length) {
      const fqName = queue.shift()!;
      if (visited.has(fqName)) {
        continue;
      }
      visited.add(fqName);
      result.push(fqName);
      queue.push(...(this.getEntityType(fqName)?.baseClasses ?? []));
    }

    return result;
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
