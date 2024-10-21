import { MappedConverterChains } from "@odata2ts/converter-runtime";
import type { DigestionOptions } from "../FactoryFunctionModel.js";
import {
  ComplexTypeGenerationOptions,
  EntityTypeGenerationOptions,
  Modes,
  PropertyGenerationOptions,
} from "../OptionModel.js";
import { DataModel, NamespaceWithAlias, withNamespace } from "./DataModel.js";
import {
  ComplexType as ComplexModelType,
  DataTypes,
  EntityType as EntityModelType,
  ODataVersion,
  PropertyModel,
} from "./DataTypeModel.js";
import { ComplexType, EntityType, EnumType, Property, Schema, TypeDefinition } from "./edmx/ODataEdmxModelBase.js";
import { EntityContainerV3, SchemaV3 } from "./edmx/ODataEdmxModelV3.js";
import { EntityContainerV4, SchemaV4 } from "./edmx/ODataEdmxModelV4.js";
import { NamingHelper } from "./NamingHelper.js";
import { ServiceConfigHelper, WithoutName } from "./ServiceConfigHelper.js";
import { NameClashValidator } from "./validation/NameClashValidator.js";
import { NameValidator } from "./validation/NameValidator.js";
import { NoopValidator } from "./validation/NoopValidator.js";

type CollectorTuple = [
  Array<PropertyModel>,
  Array<string>,
  { fqIdName: string; idName: string; qIdName: string; open: boolean },
];

function ifTrue(value: string | undefined): boolean {
  return value === "true";
}

function ifFalse(value: string | undefined): boolean {
  return value === "false";
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

  protected constructor(
    protected version: ODataVersion,
    protected schemas: Array<S>,
    protected options: DigestionOptions,
    protected namingHelper: NamingHelper,
    converters?: MappedConverterChains,
  ) {
    const namespaces = schemas.map<NamespaceWithAlias>((s) => [s.$.Namespace, s.$.Alias]);
    this.dataModel = new DataModel(namespaces, version, converters);
    this.serviceConfigHelper = new ServiceConfigHelper(options);
    this.nameValidator = options.bundledFileGeneration ? new NameClashValidator(options) : new NoopValidator();

    this.collectModelTypes(schemas);
  }

  private collectModelTypes(schemas: Array<S>) {
    schemas.forEach((schema) => {
      const { Namespace: ns, Alias: alias } = schema.$;

      schema.EnumType?.forEach((et) => {
        this.addModel2Type(ns, alias, et.$.Name, DataTypes.EnumType);
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

  protected abstract digestOperations(schema: SchemaV3 | SchemaV4): void;

  protected abstract digestEntityContainer(schema: SchemaV3 | SchemaV4): void;

  /**
   * Get essential infos about a given odata type from the version specific service variants.
   *
   * @param type
   * @return tuple of return type, query object, query collection object
   */
  protected abstract mapODataType(type: string): TypeModel;

  public async digest(): Promise<DataModel> {
    this.digestEntityTypesAndOperations();

    // delegate to version specific entity container digestion
    this.schemas.forEach((schema) => this.digestEntityContainer(schema));

    this.dataModel.setNameValidation(this.nameValidator.validate());
    return this.dataModel;
  }

  private digestEntityTypesAndOperations() {
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
    this.postProcessKeys();

    this.schemas.forEach((schema) => {
      this.analyzeModelUsage(schema.EntityContainer?.length ? schema.EntityContainer[0] : undefined);
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
      return this.mapProp(p, epConfig);
    });

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
        members: et.Member?.length ? et.Member.map((m) => ({ name: m.$.Name, value: m.$.Value })) : [],
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
        getKeyUnion: () => keyNames.join(" | "),
        subtypes: new Set(),
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
      // build up set of subtypes for each complex type
      this.addSubtypes(et);

      // get props & keys from base types
      const [baseProps, baseKeys, baseAttributes] = this.collectBaseClassPropsAndKeys(et, []);
      const { fqIdName, idName, qIdName, open } = baseAttributes;
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
      et.keyNames.unshift(...baseKeys.filter((bk) => !et.keyNames.includes(bk)));
    });
  }

  private postProcessKeys() {
    const entityTypes = this.dataModel.getEntityTypes();
    entityTypes.forEach((et) => {
      const isSingleKey = et.keyNames.length === 1;
      const props = [...et.baseProps, ...et.props];
      et.keys = et.keyNames.map((keyName) => {
        const prop = props.find((p) => p.odataName === keyName);
        if (!prop) {
          throw new Error(`Key with name [${keyName}] not found in props!`);
        }

        // automatically set key prop to managed, if this is the only key of the given entity
        if (prop.managed === undefined) {
          prop.managed = !this.options.disableAutoManagedKey && isSingleKey;
        }

        return prop;
      });
    });
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

        let { fqIdName, idName, qIdName, open } = attributes;

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
        return [props, keys, { fqIdName, idName, qIdName, open }];
      },
      [[], [], { fqIdName: "", idName: "", qIdName: "", open: false }] as CollectorTuple,
    );
  }

  protected mapProp = (p: Property, entityPropConfig?: PropertyGenerationOptions | undefined): PropertyModel => {
    if (!p.$.Type) {
      throw new Error(`No type information given for property [${p.$.Name}]!`);
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
      if (!modelType) {
        throw new Error(
          `Couldn't determine model type (EntityType, ComplexType, etc) for property "${p.$.Name}"! Given data type: "${odataDataType}".`,
        );
      }

      // special handling for enums
      if (modelType === DataTypes.EnumType) {
        const enumConfig = this.serviceConfigHelper.findEnumTypeConfig(dataTypeNamespace, dataTypeName);
        result = {
          dataType: modelType,
          type: this.namingHelper.getEnumName(enumConfig?.mappedName ?? odataDataType),
          qPath: this.options.numericEnums ? "QNumericEnumPath" : "QEnumPath",
          qObject: isCollection
            ? this.options.numericEnums
              ? "QNumericEnumCollection"
              : "QEnumCollection"
            : undefined,
          qParam: this.options.numericEnums ? "QNumericEnumParam" : "QEnumParam",
        };
      }
      // handling of complex & entity types
      else {
        const entityConfig =
          modelType === DataTypes.ComplexType
            ? this.serviceConfigHelper.findComplexTypeConfig(dataTypeNamespace, dataTypeName)
            : this.serviceConfigHelper.findEntityTypeConfig(dataTypeNamespace, dataTypeName);
        const typeName = entityConfig?.mappedName ?? odataDataType;

        result = {
          dataType: modelType,
          type: this.namingHelper.getModelName(typeName),
          qPath: "QEntityPath",
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
        qPath,
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
      managed: typeof entityPropConfig?.managed !== "undefined" ? entityPropConfig.managed : configProp?.managed,
      ...result,
    };
  };

  private addSubtypes(model: ComplexModelType, grandChildren = new Set<string>()) {
    if (!model.baseClasses.length) {
      return;
    }

    model.baseClasses.forEach((baseClass) => {
      const baseType = this.dataModel.getModel(baseClass) as ComplexModelType;

      // add subtypes
      baseType.subtypes.add(model.fqName);
      grandChildren.forEach((gc) => baseType.subtypes.add(gc));

      // recursive
      grandChildren.add(model.fqName);
      this.addSubtypes(baseType, grandChildren);
    });
  }
}
