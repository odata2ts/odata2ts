import { MappedConverterChains } from "@odata2ts/converter-runtime";
import { ODataTypesV4 } from "@odata2ts/odata-core";
import type { DigestionOptions } from "../FactoryFunctionModel.js";
import {
  ComplexTypeGenerationOptions,
  EntityTypeGenerationOptions,
  EnumSynthesis,
  KeyProperties,
  ManagedState,
  Modes,
  PropertyGenerationOptions,
} from "../OptionModel.js";
import { AllowedValuesEnumSynthesizer, SynthesizedEnum } from "./AllowedValuesEnumSynthesizer.js";
import { AnnotationResolver } from "./AnnotationResolver.js";
import { ComplexTypeUnflattener } from "./ComplexTypeUnflattener.js";
import { AlternateKeyRef, getAlternateKeys, getManagedState, isOptionalParameter } from "./CoreAnnotations.js";
import { DataModel, NamespaceWithAlias, withNamespace } from "./DataModel.js";
import {
  ComplexType as ComplexModelType,
  DataTypes,
  EntityType as EntityModelType,
  ODataVersion,
  PropertyModel,
} from "./DataTypeModel.js";
import {
  ComplexType,
  EntityType,
  EnumType,
  Property,
  Reference,
  Schema,
  TypeDefinition,
} from "./edmx/ODataEdmxModelBase.js";
import { EntityContainerV3, SchemaV3 } from "./edmx/ODataEdmxModelV3.js";
import { EntityContainerV4, SchemaV4 } from "./edmx/ODataEdmxModelV4.js";
import { NamingHelper } from "./NamingHelper.js";
import { QueryObjectTypes } from "./QueryObjectTypes.js";
import { ServiceConfigHelper, WithoutName } from "./ServiceConfigHelper.js";
import { NameClashValidator } from "./validation/NameClashValidator.js";
import { NamespaceNameValidator } from "./validation/NamespaceNameValidator.js";
import { NameValidator } from "./validation/NameValidator.js";

type CollectorTuple = [
  Array<PropertyModel>,
  Array<string>,
  { fqIdName: string; idName: string; qIdName: string; open: boolean; hasStream: boolean },
];

/**
 * The value of an enum member, as a number wherever it is one.
 *
 * A declared enum numbers its members, but the parsed EDMX hands every attribute over as the string it is
 * written as - so without this, `members[].value` would be a number only for the enums
 * {@link AllowedValuesEnumSynthesizer} derives, and a string for every declared one. Anything that has to
 * tell numbers from names would then have to know which of the two it is looking at.
 */
function memberValue(value: number | string): number | string {
  return typeof value === "string" && /^[+-]?\d+$/.test(value) ? Number(value) : value;
}

function ifTrue(value: string | undefined): boolean {
  return value === "true";
}

function ifFalse(value: string | undefined): boolean {
  return value === "false";
}

/**
 * The configured managed state, where the booleans are shorthands for the two states one would want to
 * state most often.
 */
function toManagedState(configured: boolean | ManagedState | undefined): ManagedState | undefined {
  if (typeof configured === "boolean") {
    return configured ? ManagedState.readOnly : ManagedState.off;
  }
  return configured;
}

export interface TypeModel {
  outputType: string;
  qPath: string;
  qCollection: string;
  qParam: string | undefined;
}

export abstract class Digester<S extends Schema<ET, CT>, ET extends EntityType, CT extends ComplexType> {
  protected static EDM_PREFIX = "Edm.";

  protected readonly dataModel: DataModel;
  protected readonly serviceConfigHelper: ServiceConfigHelper;
  protected readonly nameValidator: NameValidator;

  /**
   * Reverse mapping from fqName to data type: EntityType, ComplexType, EnumType, or Primitive Type.
   */
  private model2Type = new Map<string, DataTypes>();

  /**
   * The complex properties which `unflattenComplexTypes` formed from flat ones, as
   * `<fully qualified model name>/<property name>`. They are the ones which still travel and are queried
   * flat, hence they get a `QFlatComplexPath` instead of a `QComplexPath`.
   */
  private flattenedProps = new Set<string>();

  /**
   * The managed state the annotations of the service state for a property, as
   * `<fully qualified model name>/<property name>`.
   *
   * Collected while mapping the properties, but applied only once inheritance has been resolved, since it
   * takes knowing the keys of an entity to settle the state. Keyed by name rather than by property object,
   * because {@link postProcessModel} clones the inherited ones.
   */
  private annotatedManagedStates = new Map<string, ManagedState>();

  /**
   * The alternate keys stated on an entity type, by its fully qualified name, as raw name/alias pairs -
   * not yet resolved to {@link PropertyModel}s. `Core.AlternateKeys` may also apply to an `EntitySet` or
   * `NavigationProperty`, but only the `EntityType` target is read: the generated `Q*Id` is one artifact
   * shared by every access path (the entity set, every navigation property, every subtype cast), so only
   * a statement that itself applies to the type - not to one particular way of reaching it - can be
   * represented there. See {@link resolveAlternateKeys}.
   */
  private alternateKeyRefs = new Map<string, Array<Array<AlternateKeyRef>>>();

  /**
   * The enums declared `IsFlags="true"`, by fully qualified name and by alias. Their members are bits and
   * may be combined, which is what makes the `has` operator applicable to them and to nothing else.
   */
  private flagsEnums = new Set<string>();

  /**
   * The enums {@link AllowedValuesEnumSynthesizer} derived from annotations, by fully qualified name.
   * Indistinguishable from a declared one in the EDMX by then, but they need a conversion of their own.
   */
  private synthesizedEnums = new Map<string, SynthesizedEnum>();

  protected constructor(
    protected version: ODataVersion,
    protected schemas: Array<S>,
    protected options: DigestionOptions,
    protected namingHelper: NamingHelper,
    converters?: MappedConverterChains,
    protected references?: Array<Reference>,
  ) {
    const namespaces = schemas.map<NamespaceWithAlias>((s) => [s.$.Namespace, s.$.Alias]);
    this.dataModel = new DataModel(namespaces, version, converters);
    this.serviceConfigHelper = new ServiceConfigHelper(options);
    this.nameValidator = options.bundledFileGeneration ? new NameClashValidator(options) : new NamespaceNameValidator();

    // annotations first: from here on every term is fully qualified and sits on the element it applies to,
    // which also means the reshaping below carries them along without knowing about them
    new AnnotationResolver(this.schemas, this.references).resolve();

    // types the service describes rather than declares become declared ones, before anything - including
    // the collection of model types right below - gets to look at the document
    if (options.enumSynthesized === EnumSynthesis.allowedValuesAndSymbolicName) {
      this.synthesizedEnums = new AllowedValuesEnumSynthesizer<ET, CT>(this.schemas).synthesize();
    }

    this.collectModelTypes(schemas);
  }

  private collectModelTypes(schemas: Array<S>) {
    schemas.forEach((schema) => {
      const { Namespace: ns, Alias: alias } = schema.$;

      schema.EnumType?.forEach((et) => {
        this.addModel2Type(ns, alias, et.$.Name, DataTypes.EnumType);
        if (ifTrue(et.$.IsFlags)) {
          this.flagsEnums.add(withNamespace(ns, et.$.Name));
          if (alias) {
            this.flagsEnums.add(withNamespace(alias, et.$.Name));
          }
        }
      });
      schema.ComplexType?.forEach((ct) => {
        this.addModel2Type(ns, alias, ct.$.Name, DataTypes.ComplexType);
      });
      schema.EntityType?.forEach((et) => {
        this.addModel2Type(ns, alias, et.$.Name, DataTypes.ModelType);
      });
    });
  }

  private addModel2Type(ns: string, alias: string | undefined, name: string, dt: DataTypes) {
    this.model2Type.set(withNamespace(ns, name), dt);
    if (alias) {
      this.model2Type.set(withNamespace(alias, name), dt);
    }
  }

  protected abstract getNavigationProps(entityType: ET | ComplexType): Array<Property>;

  /**
   * Whether a navigation property contains its targets, which is stated by `ContainsTarget="true"`.
   *
   * Answered here for V2, which has no notion of containment at all, so nothing is ever contained.
   */
  protected isContained(p: Property): boolean {
    return false;
  }

  protected abstract digestOperations(schema: SchemaV3 | SchemaV4): void;

  protected abstract digestEntityContainer(schema: SchemaV3 | SchemaV4): void;

  /**
   * Get essential infos about a given odata type from the version specific service variants.
   *
   * @param type
   * @return tuple of return type, query object, query collection object
   */
  protected abstract mapODataType(type: string): TypeModel;

  /**
   * Whether the entity's own representation is binary content: a media entity in V4, a media link entry
   * in V2. Both versions know the same marker, V2 puts it into the metadata namespace though.
   */
  protected isMediaEntity(entityType: ET): boolean {
    return ifTrue(entityType.$.HasStream);
  }

  public async digest(): Promise<DataModel> {
    this.digestEntityTypesAndOperations();

    // delegate to version specific entity container digestion
    this.schemas.forEach((schema) => this.digestEntityContainer(schema));

    this.dataModel.setNameValidation(this.nameValidator.validate());
    return this.dataModel;
  }

  /**
   * Resolves every entity type's raw {@link alternateKeyRefs} against its own properties, now that
   * inheritance has been resolved.
   */
  private resolveAlternateKeys() {
    const entityTypes = this.dataModel.getEntityTypes();

    // phase 1: a type with alternate keys of its own must generate its own id - never fold them into an
    // ancestor's, which every other subtype sharing that ancestor's id would then appear to support too
    // (e.g. Medium's other subtypes have no ISBN, even though PrintMedium/Book do)
    entityTypes.forEach((et) => {
      const refs = this.alternateKeyRefs.get(et.fqName);
      if (!refs) {
        return;
      }

      const props = [...et.baseProps, ...et.props];
      et.alternateKeys = refs.map((altKey) =>
        altKey.map(({ name, alias }) => {
          const property = props.find((p) => p.odataName === name);
          if (!property) {
            throw new Error(
              `Core.AlternateKeys: property [${name}] not found among the properties of entity type [${et.fqName}]!`,
            );
          }
          return { property, alias };
        }),
      );

      if (!et.generateId) {
        et.generateId = true;
        et.id = {
          fqName: et.fqName,
          modelName: this.namingHelper.getIdModelName(et.name),
          qName: this.namingHelper.getQIdFunctionName(et.name),
        };
      }
    });

    // phase 2: a type that still shares another type's id (no key, no alternate key of its own) has to
    // point at the *nearest* id-generating ancestor - which phase 1 may just have moved closer, e.g. Book
    // (no key, no alternate key of its own) now shares PrintMedium's id instead of skipping past it to
    // Medium's
    entityTypes.forEach((et) => {
      if (et.generateId) {
        return;
      }
      let owner = et;
      while (!owner.generateId && owner.baseClasses.length) {
        const parent = this.dataModel.getEntityType(owner.baseClasses[0]);
        if (!parent) {
          break;
        }
        owner = parent;
      }
      if (owner !== et && owner.generateId) {
        et.id = { fqName: owner.fqName, modelName: owner.id.modelName, qName: owner.id.qName };
      }
    });
  }

  private digestEntityTypesAndOperations() {
    // reshaping happens on the EDMX itself, before anything is digested: from here on the model looks like
    // one the service stated in that shape to begin with
    if (this.options.unflattenComplexTypes) {
      this.flattenedProps = new ComplexTypeUnflattener<ET, CT>(this.schemas, (model) =>
        this.getNavigationProps(model).map((np) => np.$.Name),
      ).unflatten();
    }

    this.schemas.forEach((schema) => {
      const ns: NamespaceWithAlias = [schema.$.Namespace, schema.$.Alias];

      // type definitions: alias for primitive types
      this.addTypeDefinition(schema.$.Namespace, schema.TypeDefinition);

      // enums
      this.addEnum(ns, schema.EnumType);

      // complex types
      this.addComplexType(ns, schema.ComplexType);

      // entity types
      this.addEntityType(ns, schema.EntityType);

      // V4 only: function & action types
      this.digestOperations(schema);
    });

    this.postProcessModel();
    this.deriveManagedState();
    this.resolveAlternateKeys();

    this.schemas.forEach((schema) => {
      this.analyzeModelUsage(schema.EntityContainer?.length ? schema.EntityContainer[0] : undefined);
    });
  }

  /**
   * Two OData property names may well end up as the same TypeScript name: `Location_` and `Location` both
   * become `location` once a naming strategy is applied. The generated interface would declare that name
   * twice and the query object would build two paths under it - at runtime the second one simply wins,
   * which silently makes one of the two properties unreachable. So this is an error, not a warning.
   *
   * There is nothing to resolve automatically here: only the user knows which of the two properties should
   * carry the plain name, hence the pointer at the configuration.
   */
  private assertNoPropNameClash(props: Array<PropertyModel>, fqName: string) {
    const odataNamesByPropName = new Map<string, string>();

    props.forEach(({ name, odataName }) => {
      const clashingOdataName = odataNamesByPropName.get(name);
      if (clashingOdataName) {
        throw new Error(
          `Name clash in "${fqName}": the properties "${clashingOdataName}" and "${odataName}" both result in the name "${name}"! ` +
            `Map one of them to a name of its own, e.g. propertiesByName: [{ name: "${odataName}", mappedName: "someOtherName" }] ` +
            `- or scoped to this type via byTypeAndName: [{ name: "${fqName}", type: TypeModel.EntityType, properties: [...] }].`,
        );
      }
      odataNamesByPropName.set(name, odataName);
    });
  }

  private getBaseModel(
    entityConfig: WithoutName<EntityTypeGenerationOptions | ComplexTypeGenerationOptions> | undefined,
    model: ComplexType,
    namespace: string,
    name: string,
    fqName: string,
  ) {
    const odataName = model.$.Name;

    // map properties respecting the config
    const props = [...(model.Property ?? []), ...this.getNavigationProps(model)].map((p) => {
      const epConfig = entityConfig?.properties?.find((ep) => ep.name === p.$.Name);
      return this.mapProp(p, epConfig, fqName);
    });
    this.assertNoPropNameClash(props, fqName);

    // support for base types, i.e. extends clause of interfaces
    const baseClasses = [];
    let finalBaseClass: string | undefined = undefined;
    if (model.$.BaseType) {
      baseClasses.push(model.$.BaseType);
      const [baseName, basePrefix] = this.namingHelper.getNameAndServicePrefix(model.$.BaseType);
      const baseConfig =
        this.serviceConfigHelper.findEntityTypeConfig([basePrefix!], baseName) ||
        this.serviceConfigHelper.findComplexTypeConfig([basePrefix!], baseName);
      finalBaseClass = baseConfig?.mappedName ?? baseName;
    }

    return {
      fqName,
      odataName,
      name,
      modelName: this.namingHelper.getModelName(name),
      qName: this.namingHelper.getQName(name),
      editableName: this.namingHelper.getEditableModelName(name),
      updatableName: this.namingHelper.getUpdatableModelName(name),
      serviceName: this.namingHelper.getServiceName(name),
      serviceCollectionName: this.namingHelper.getCollectionServiceName(name),
      folderPath: this.namingHelper.getFolderPath(namespace, name),
      baseClasses,
      finalBaseClass,
      props,
      baseProps: [], // postprocess required
      abstract: ifTrue(model.$.Abstract),
      open: ifTrue(model.$.OpenType),
      genMode: Modes.qobjects,
      subtypes: new Set(),
    } satisfies Partial<ComplexModelType>;
  }

  private addTypeDefinition(ns: string, types: Array<TypeDefinition> | undefined) {
    if (!types || !types.length) {
      return;
    }

    for (const t of types) {
      this.dataModel.addTypeDefinition(ns, t.$.Name, t.$.UnderlyingType);
    }
  }

  private addEnum(namespace: NamespaceWithAlias, models: Array<EnumType> | undefined) {
    if (!models || !models.length) {
      return;
    }

    for (const et of models) {
      const odataName = et.$.Name;
      const fqName = withNamespace(namespace[0], odataName);
      const config = this.serviceConfigHelper.findEnumTypeConfig(namespace, odataName);
      const enumName = this.nameValidator.addEnumType(fqName, config?.mappedName || odataName);
      const filePath = this.namingHelper.getFolderPath(namespace[0], enumName);
      this.dataModel.addEnum(namespace[0], odataName, {
        fqName,
        odataName,
        name: enumName,
        modelName: this.namingHelper.getEnumName(enumName),
        folderPath: filePath,
        members: et.Member?.length ? et.Member.map((m) => ({ name: m.$.Name, value: memberValue(m.$.Value) })) : [],
        isFlags: ifTrue(et.$.IsFlags),
        wireType: this.synthesizedEnums.get(fqName)?.wireType,
      });
    }
  }

  private addComplexType(namespace: NamespaceWithAlias, models: Array<ComplexType> | undefined) {
    if (!models || !models.length) {
      return;
    }

    for (const model of models) {
      const config = this.serviceConfigHelper.findComplexTypeConfig(namespace, model.$.Name);
      const fqName = withNamespace(namespace[0], model.$.Name);
      const name = this.nameValidator.addComplexType(fqName, config?.mappedName || model.$.Name);
      const baseModel = this.getBaseModel(config, model, namespace[0], name, fqName);
      this.dataModel.addComplexType(namespace[0], baseModel.odataName, baseModel);
    }
  }

  private addEntityType(namespace: NamespaceWithAlias, models: Array<ET> | undefined) {
    if (!models || !models.length) {
      return;
    }

    for (const model of models) {
      const entityConfig = this.serviceConfigHelper.findEntityTypeConfig(namespace, model.$.Name);
      const fqName = withNamespace(namespace[0], model.$.Name);
      const name = this.nameValidator.addEntityType(fqName, entityConfig?.mappedName || model.$.Name);
      const baseModel = this.getBaseModel(entityConfig, model, namespace[0], name, fqName);

      // key support: we add keys from this entity,
      // but not keys stemming from base classes (postprocess required)
      const keyNames: Array<string> = [];
      if (entityConfig?.keys?.length) {
        keyNames.push(...entityConfig.keys);
      } else {
        const entity = model as EntityType;
        if (entity.Key && entity.Key.length && entity.Key[0].PropertyRef.length) {
          const propNames = entity.Key[0].PropertyRef.map((key) => key.$.Name);
          keyNames.push(...propNames);
        }
      }

      // Core.AlternateKeys is a V4/Core-vocabulary concept - V2 is left untouched by this, even where
      // a service (CAP does) states the term on V2 metadata too
      if (this.version === ODataVersion.V4 && !this.options.annotations?.disableAlternateKeys) {
        const alternateKeyRefs = getAlternateKeys(model.Annotation);
        if (alternateKeyRefs) {
          this.alternateKeyRefs.set(fqName, alternateKeyRefs);
        }
      }

      this.dataModel.addEntityType(namespace[0], baseModel.odataName, {
        ...baseModel,
        id: {
          fqName: baseModel.fqName,
          modelName: this.namingHelper.getIdModelName(name),
          qName: this.namingHelper.getQIdFunctionName(name),
        },
        generateId: !!keyNames.length,
        keyNames: keyNames, // postprocess required to include key specs from base classes
        keys: [], // postprocess required to include props from base classes
        // postprocess required as well: resolveAlternateKeys resolves the raw refs read below into this
        alternateKeys: [],
        getKeyUnion: () => keyNames.join(" | "),
        subtypes: new Set(),
        // postprocess required as well: the media entity marker is inherited from base types
        hasStream: this.isMediaEntity(model),
        // set while digesting the entity container, which is where the entity sets and singletons
        // exposing this type - and their `Core.OptimisticConcurrency` - are read
        concurrencyControlled: false,
      });
    }
  }

  /**
   * Check that models (ComplexType or EntityType) have been referenced in the API
   * as entry point or via navProp or by virtue of being a base type or subtype of those.
   * For these models one or two services are generated.
   *
   * In this way unnecessary service generation is prevented. For example, complex types that
   * are only referenced as response of an operation do not need a generated service.
   *
   * @param ec
   * @private
   */
  private analyzeModelUsage(ec: EntityContainerV3 | EntityContainerV4 | undefined) {
    if (ec?.EntitySet?.length) {
      ec.EntitySet.forEach((et) => this.analyze(et.$.EntityType));
    }
    const ec4 = ec as EntityContainerV4;
    if (ec4?.Singleton?.length) {
      ec4.Singleton.forEach((singleton) => this.analyze(singleton.$.Type));
    }
  }

  /**
   * Check usage of model types within API.
   *
   * @param fqModelName
   * @private
   */
  private analyze(fqModelName: string) {
    // to also resolve aliases the data model needs to be used
    const model = this.dataModel.getEntityType(fqModelName) ?? this.dataModel.getComplexType(fqModelName);
    if (!model?.fqName || model.genMode === Modes.service) {
      return;
    }

    model.genMode = Modes.service;

    if (model) {
      // respect base classes
      if (model.baseClasses.length) {
        this.analyze(model.baseClasses[0]);
      }
      // include subtypes since each base class can be cast to its subtypes
      model.subtypes.forEach((subtype) => {
        this.analyze(subtype);
      });
      model?.props.forEach((p) => {
        if (p.dataType === DataTypes.ComplexType || p.dataType === DataTypes.ModelType) {
          this.analyze(p.fqType);
        }
      });
    }
  }

  private postProcessModel() {
    // complex types
    const complexTypes = this.dataModel.getComplexTypes();
    complexTypes.forEach((ct) => {
      // build up set of subtypes for each complex type
      this.addSubtypes(ct);

      // get props & keys from base types
      const [baseProps, _, baseAttributes] = this.collectBaseClassPropsAndKeys(ct, []);
      const { open } = baseAttributes;
      ct.baseProps = baseProps.map((bp) => ({ ...bp }));
      if (open) {
        ct.open = true;
      }
    });
    // entity types
    const entityTypes = this.dataModel.getEntityTypes();
    entityTypes.forEach((et) => {
      // build up set of subtypes for each entity type
      this.addSubtypes(et);

      // get props & keys from base types
      const [baseProps, baseKeys, baseAttributes] = this.collectBaseClassPropsAndKeys(et, []);
      const { fqIdName, idName, qIdName, open, hasStream } = baseAttributes;
      et.baseProps = baseProps.map((bp) => ({ ...bp }));

      if (!et.keyNames.length && idName) {
        et.id = {
          fqName: fqIdName,
          modelName: idName,
          qName: qIdName,
        };
        et.generateId = false;
      }
      if (open) {
        et.open = open;
      }
      if (hasStream) {
        et.hasStream = true;
      }
      et.keyNames.unshift(...baseKeys.filter((bk) => !et.keyNames.includes(bk)));
    });
  }

  /**
   * Settles the managed state of every property, now that inheritance has been resolved and it is known
   * which of them are keys.
   *
   * Configuration has already been applied by {@link mapProp} and wins; everything else is decided here,
   * from the annotations of the service and, for a key, from `keyProperties`.
   */
  private deriveManagedState() {
    const complexTypes = this.dataModel.getComplexTypes();
    complexTypes.forEach((ct) => {
      // a complex type has no key, so the key branch never applies to one of its properties
      [...ct.baseProps, ...ct.props].forEach((prop) => this.deriveManagedStateOfProp(prop, ct, false, false));
    });

    const entityTypes = this.dataModel.getEntityTypes();
    entityTypes.forEach((et) => {
      const props = [...et.baseProps, ...et.props];
      const isSingleKey = et.keyNames.length === 1;
      props.forEach((prop) =>
        this.deriveManagedStateOfProp(prop, et, et.keyNames.includes(prop.odataName), isSingleKey),
      );

      et.keys = et.keyNames.map((keyName) => {
        const prop = props.find((p) => p.odataName === keyName);
        if (!prop) {
          throw new Error(`Key with name [${keyName}] not found in props!`);
        }
        return prop;
      });
    });
  }

  /**
   * The state the service annotated a property with, looked up in the model that declares it: an inherited
   * property is annotated on the base type, and reaches its subtypes as a clone.
   */
  private findAnnotatedState(model: ComplexModelType, propName: string): ManagedState | undefined {
    const own = this.annotatedManagedStates.get(`${model.fqName}/${propName}`);
    if (own) {
      return own;
    }

    for (const baseClass of model.baseClasses) {
      const baseModel = this.dataModel.getEntityType(baseClass) || this.dataModel.getComplexType(baseClass);
      const inherited = baseModel && this.findAnnotatedState(baseModel, propName);
      if (inherited) {
        return inherited;
      }
    }

    return undefined;
  }

  private deriveManagedStateOfProp(prop: PropertyModel, model: ComplexModelType, isKey: boolean, isSingleKey: boolean) {
    // the configuration has spoken, which beats every source this could derive a state from
    if (prop.managed !== undefined) {
      return;
    }

    const byAnnotation = this.options.annotations?.disableManagedProperties
      ? undefined
      : this.findAnnotatedState(model, prop.odataName);
    if (byAnnotation) {
      prop.managed = byAnnotation;
      return;
    }

    // nothing but a key can be derived without being told: it identifies the entity, so it cannot change
    // once the entity exists. Who supplies the value is the part no metadata reveals - hence the option.
    if (!isKey) {
      return;
    }

    switch (this.options.keyProperties) {
      case KeyProperties.strict:
        prop.managed = ManagedState.createOnly;
        break;
      case KeyProperties.singleComputed:
        // a composite key is rarely server-generated, so its parts are left entirely alone
        if (isSingleKey) {
          prop.managed = ManagedState.readOnly;
        }
        break;
      case KeyProperties.singleComputedComplexOptional:
        prop.managed = isSingleKey ? ManagedState.readOnly : ManagedState.optionalWithDefault;
        break;
      case KeyProperties.allComputed:
        prop.managed = ManagedState.readOnly;
        break;
      case KeyProperties.interoperable:
      default:
        // immutable like `strict`, but not demanded on create: the client cannot supply what the server
        // generates, and a server which generates keys silently is the case this default exists for
        prop.managed = ManagedState.createOnly;
        prop.optionalOnCreate = true;
        break;
    }
  }

  private collectBaseClassPropsAndKeys(model: ComplexModelType, visitedModels: string[]): CollectorTuple {
    if (visitedModels.includes(model.fqName)) {
      throw new Error(`Cyclic inheritance detected for model ${model.fqName}!`);
    }
    visitedModels.push(model.fqName);
    return model.baseClasses.reduce(
      ([props, keys, attributes], bc) => {
        const baseModel = this.dataModel.getEntityType(bc) || this.dataModel.getComplexType(bc);
        if (!baseModel) {
          throw new Error(`BaseModel "${bc}" doesn't exist!`);
        }

        let { fqIdName, idName, qIdName, open, hasStream } = attributes;

        // recursive
        if (baseModel.baseClasses.length) {
          const [parentProps, parentKeys, parentAttributes] = this.collectBaseClassPropsAndKeys(
            baseModel,
            visitedModels,
          );
          props.unshift(...parentProps);
          keys.unshift(...parentKeys);
          if (parentAttributes?.idName) {
            fqIdName = parentAttributes.fqIdName;
            idName = parentAttributes.idName;
            qIdName = parentAttributes.qIdName;
          }
          if (parentAttributes?.open) {
            open = true;
          }
          if (parentAttributes?.hasStream) {
            hasStream = true;
          }
        }

        props.push(...baseModel.props);
        const entityModel = baseModel as EntityModelType;
        if (entityModel.keyNames?.length) {
          keys.push(...entityModel.keyNames.filter((kn) => !keys.includes(kn)));
          fqIdName = entityModel.id.fqName;
          idName = entityModel.id.modelName;
          qIdName = entityModel.id.qName;
        }
        if (baseModel.open) {
          open = true;
        }
        // media entities pass the trait on: a type derived from one is a media entity itself
        if (entityModel.hasStream) {
          hasStream = true;
        }
        return [props, keys, { fqIdName, idName, qIdName, open, hasStream }];
      },
      [[], [], { fqIdName: "", idName: "", qIdName: "", open: false, hasStream: false }] as CollectorTuple,
    );
  }

  /**
   * @param p the property to map
   * @param entityPropConfig the configuration for the prop
   * @param fqOwnerName the fully qualified name of the model this property belongs to, where there is one -
   *   operation parameters and return types have no owner. Only needed to recognise a property which
   *   `unflattenComplexTypes` reshaped.
   */
  protected mapProp = (
    p: Property,
    entityPropConfig?: PropertyGenerationOptions | undefined,
    fqOwnerName?: string,
  ): PropertyModel => {
    if (!p.$.Type) {
      throw new Error(`No type information given for property [${p.$.Name}]!`);
    }

    if (fqOwnerName) {
      const annotated = getManagedState(p.Annotation);
      if (annotated) {
        this.annotatedManagedStates.set(`${fqOwnerName}/${p.$.Name}`, annotated);
      }
    }

    const configProp = this.serviceConfigHelper.findPropConfigByName(p.$.Name);
    const modelName = this.namingHelper.getModelPropName(
      entityPropConfig?.mappedName || configProp?.mappedName || p.$.Name,
    );
    const isCollection = !!p.$.Type.match(/^Collection\(/);
    let odataDataType = p.$.Type.replace(/^Collection\(([^\)]+)\)/, "$1");

    // support for primitive type mapping
    if (this.namingHelper.includesServicePrefix(odataDataType)) {
      const dt = this.dataModel.getPrimitiveType(odataDataType);
      if (dt !== undefined) {
        odataDataType = dt;
      }
    }

    let result: Pick<PropertyModel, "dataType" | "type" | "typeModule" | "qPath" | "qParam" | "qObject" | "converters">;

    // domain object known from service:
    // EntityType, ComplexType, EnumType
    if (this.namingHelper.includesServicePrefix(odataDataType)) {
      const modelType = this.model2Type.get(odataDataType)!;
      const [dataTypeName, dataTypePrefix] = this.namingHelper.getNameAndServicePrefix(odataDataType);
      const dataTypeNamespace: NamespaceWithAlias = [dataTypePrefix!];
      const isComplexType = modelType === DataTypes.ComplexType;
      if (!modelType) {
        throw new Error(
          `Couldn't determine model type (EntityType, ComplexType, etc) for property "${p.$.Name}"! Given data type: "${odataDataType}".`,
        );
      }

      // special handling for enums
      if (modelType === DataTypes.EnumType) {
        // the numeric variants transmit the name of a member, which is what a declared enum does. An enum
        // derived from `Validation.AllowedValues` is not one, so the value goes on the wire and the
        // conversion happens through the converter the model generator emits next to it
        const isNumericEnum = this.options.enumType === "numeric" && !this.synthesizedEnums.has(odataDataType);
        const enumConfig = this.serviceConfigHelper.findEnumTypeConfig(dataTypeNamespace, dataTypeName);
        // `has` is defined for a flag set and for nothing else, so only a flags enum gets the path which
        // offers it. Collections keep the plain path: `has` applies to the property, not to its items.
        const isFlags = this.flagsEnums.has(odataDataType);
        result = {
          dataType: modelType,
          type: this.namingHelper.getEnumName(enumConfig?.mappedName ?? odataDataType),
          qPath: isCollection
            ? isNumericEnum
              ? QueryObjectTypes.QNumericEnumCollectionPath
              : QueryObjectTypes.QEnumCollectionPath
            : isNumericEnum
              ? isFlags
                ? QueryObjectTypes.QNumericFlagsEnumPath
                : QueryObjectTypes.QNumericEnumPath
              : isFlags
                ? QueryObjectTypes.QFlagsEnumPath
                : QueryObjectTypes.QEnumPath,
          qObject: isCollection
            ? isNumericEnum
              ? QueryObjectTypes.QNumericEnumCollection
              : QueryObjectTypes.QEnumCollection
            : undefined,
          qParam: isNumericEnum ? "QNumericEnumParam" : "QEnumParam",
        };
      }
      // handling of complex & entity types
      else {
        const entityConfig = isComplexType
          ? this.serviceConfigHelper.findComplexTypeConfig(dataTypeNamespace, dataTypeName)
          : this.serviceConfigHelper.findEntityTypeConfig(dataTypeNamespace, dataTypeName);
        const typeName = entityConfig?.mappedName ?? odataDataType;

        result = {
          dataType: modelType,
          type: this.namingHelper.getModelName(typeName),
          qPath: isCollection
            ? isComplexType
              ? QueryObjectTypes.QComplexCollectionPath
              : QueryObjectTypes.QEntityCollectionPath
            : isComplexType
              ? this.flattenedProps.has(`${fqOwnerName}/${p.$.Name}`)
                ? QueryObjectTypes.QFlatComplexPath
                : QueryObjectTypes.QComplexPath
              : QueryObjectTypes.QEntityPath,
          qObject: this.namingHelper.getQName(typeName),
          qParam: "QComplexParam",
        };
      }
    }
    // OData built-in data types
    else if (odataDataType.startsWith(Digester.EDM_PREFIX)) {
      const { outputType, qPath, qParam, qCollection } = this.mapODataType(odataDataType);
      const { to, toModule: typeModule, converters } = this.dataModel.getConverter(odataDataType) || {};

      const type = !to ? outputType : to.startsWith(Digester.EDM_PREFIX) ? this.mapODataType(to).outputType : to;

      result = {
        dataType: DataTypes.PrimitiveType,
        type,
        typeModule,
        qPath: isCollection ? QueryObjectTypes.QCollectionPath : qPath,
        qParam,
        qObject: isCollection ? qCollection : undefined,
        converters,
      };
    } else {
      throw new Error(
        `Unknown type [${odataDataType}]: Not 'Collection(...)', not OData type 'Edm.*', not starting with one of the namespaces!`,
      );
    }

    return {
      odataName: p.$.Name,
      name: modelName,
      odataType: p.$.Type,
      fqType: odataDataType,
      required: ifFalse(p.$.Nullable),
      isCollection: isCollection,
      // only set when it applies: a flag on every single property would be noise
      ...(odataDataType === ODataTypesV4.Stream ? { isStream: true } : undefined),
      ...(this.isContained(p) ? { contained: true } : undefined),
      ...(isOptionalParameter(p.Annotation) ? { omittable: true } : undefined),
      managed: toManagedState(
        typeof entityPropConfig?.managed !== "undefined" ? entityPropConfig.managed : configProp?.managed,
      ),
      ...result,
    };
  };

  private addSubtypes(model: ComplexModelType, grandChildren = new Set<string>()) {
    if (!model.baseClasses.length) {
      return;
    }

    model.baseClasses.forEach((baseClass) => {
      const baseType = this.dataModel.getModel(baseClass) as ComplexModelType;

      // add subtypes & base name for q-objects
      baseType.subtypes.add(model.fqName);
      if (!baseType.qBaseName) {
        baseType.qBaseName = this.namingHelper.getQBaseName(baseType.name);
      }
      grandChildren.forEach((gc) => baseType.subtypes.add(gc));

      // recursive
      grandChildren.add(model.fqName);
      this.addSubtypes(baseType, grandChildren);
    });
  }
}
