import { MappedConverterChains } from "@odata2ts/converter-runtime";

import { DigestionOptions } from "../FactoryFunctionModel";
import { ComplexTypeGenerationOptions, EntityTypeGenerationOptions, PropertyGenerationOptions } from "../OptionModel";
import { DataModel, NamespaceWithAlias, withNamespace } from "./DataModel";
import { ComplexType as ComplexModelType, DataTypes, ModelType, ODataVersion, PropertyModel } from "./DataTypeModel";
import { ComplexType, EntityType, EnumType, Property, Schema, TypeDefinition } from "./edmx/ODataEdmxModelBase";
import { SchemaV3 } from "./edmx/ODataEdmxModelV3";
import { SchemaV4 } from "./edmx/ODataEdmxModelV4";
import { NamingHelper } from "./NamingHelper";
import { ServiceConfigHelper, WithoutName } from "./ServiceConfigHelper";

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

  private model2Type = new Map<string, DataTypes>();

  protected constructor(
    protected version: ODataVersion,
    protected schemas: Array<S>,
    protected options: DigestionOptions,
    protected namingHelper: NamingHelper,
    converters?: MappedConverterChains
  ) {
    const namespaces = schemas.map<NamespaceWithAlias>((s) => [s.$.Namespace, s.$.Alias]);
    this.dataModel = new DataModel(namespaces, version, converters);
    this.serviceConfigHelper = new ServiceConfigHelper(options);

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
  }

  private getBaseModel(
    entityConfig: WithoutName<EntityTypeGenerationOptions | ComplexTypeGenerationOptions> | undefined,
    namespace: NamespaceWithAlias,
    model: ComplexType
  ) {
    const odataName = model.$.Name;
    const fqName = withNamespace(namespace[0], odataName);

    const entityName = entityConfig?.mappedName || model.$.Name;

    // map properties respecting the config
    const props = [...(model.Property ?? []), ...this.getNavigationProps(model)].map((p) => {
      const epConfig = entityConfig?.properties?.find((ep) => ep.name === p.$.Name);
      return this.mapProp(p, epConfig);
    });

    // support for base types, i.e. extends clause of interfaces
    const baseClasses = [];
    if (model.$.BaseType) {
      baseClasses.push(model.$.BaseType);
    }

    return {
      fqName,
      odataName,
      name: this.namingHelper.getModelName(entityName),
      qName: this.namingHelper.getQName(entityName),
      editableName: this.namingHelper.getEditableModelName(entityName),
      baseClasses,
      props,
      baseProps: [], // postprocess required
    };
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
      const enumName = config?.mappedName || odataName;

      this.dataModel.addEnum(namespace[0], odataName, {
        fqName,
        odataName,
        name: this.namingHelper.getEnumName(enumName),
        members: et.Member.map((m) => m.$.Name),
      });
    }
  }

  private addComplexType(namespace: NamespaceWithAlias, models: Array<ComplexType> | undefined) {
    if (!models || !models.length) {
      return;
    }

    for (const model of models) {
      const config = this.serviceConfigHelper.findComplexTypeConfig(namespace, model.$.Name);
      const baseModel = this.getBaseModel(config, namespace, model);
      this.dataModel.addComplexType(namespace[0], baseModel.odataName, baseModel);
    }
  }

  private addEntityType(namespace: NamespaceWithAlias, models: Array<ET> | undefined) {
    if (!models || !models.length) {
      return;
    }

    for (const model of models) {
      const entityConfig = this.serviceConfigHelper.findEntityTypeConfig(namespace, model.$.Name);
      const baseModel = this.getBaseModel(entityConfig, namespace, model);
      const entityName = entityConfig?.mappedName || model.$.Name;

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
        idModelName: this.namingHelper.getIdModelName(entityName),
        qIdFunctionName: this.namingHelper.getQIdFunctionName(entityName),
        generateId: true,
        keyNames: keyNames, // postprocess required to include key specs from base classes
        keys: [], // postprocess required to include props from base classes
        getKeyUnion: () => keyNames.join(" | "),
      });
    }
  }

  private postProcessModel() {
    // complex types
    const complexTypes = this.dataModel.getComplexTypes();
    complexTypes.forEach((model) => {
      const [baseProps] = this.collectBaseClassPropsAndKeys(model, []);
      model.baseProps = baseProps;
    });
    // entity types
    const modelTypes = this.dataModel.getEntityTypes();
    modelTypes.forEach((model) => {
      const [baseProps, baseKeys, idName, qIdName] = this.collectBaseClassPropsAndKeys(model, []);
      model.baseProps = baseProps;

      if (!model.keyNames.length && idName) {
        model.idModelName = idName;
        model.qIdFunctionName = qIdName;
        model.generateId = false;
      }
      model.keyNames.unshift(...baseKeys);

      // sanity check: entity types require key specification
      if (!model.keyNames.length) {
        throw new Error(`Key property is missing from Entity "${model.name}" (${model.odataName})!`);
      }

      const isSingleKey = model.keyNames.length === 1;
      const props = [...model.baseProps, ...model.props];
      model.keys = model.keyNames.map((keyName) => {
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

  private collectBaseClassPropsAndKeys(
    model: ComplexModelType,
    visitedModels: string[]
  ): [Array<PropertyModel>, Array<string>, string, string] {
    if (visitedModels.includes(model.fqName)) {
      throw new Error(`Cyclic inheritance detected for model ${model.fqName}!`);
    }
    visitedModels.push(model.fqName);
    return model.baseClasses.reduce(
      ([props, keys, idName, qIdName], bc) => {
        const baseModel = this.dataModel.getEntityType(bc) || this.dataModel.getComplexType(bc);
        if (!baseModel) {
          throw new Error(`BaseModel "${bc}" doesn't exist!`);
        }

        let idNameResult = idName;
        let qIdNameResult = qIdName;

        // recursive
        if (baseModel.baseClasses.length) {
          const [parentProps, parentKeys, parentIdName, parentQIdName] = this.collectBaseClassPropsAndKeys(
            baseModel,
            visitedModels
          );
          props.unshift(...parentProps);
          keys.unshift(...parentKeys);
          if (parentIdName) {
            idNameResult = parentIdName;
            qIdNameResult = parentQIdName;
          }
        }

        props.push(...baseModel.props);
        const entityModel = baseModel as ModelType;
        if (entityModel.keyNames?.length) {
          keys.push(...entityModel.keyNames.filter((kn) => !keys.includes(kn)));
          idNameResult = entityModel.idModelName;
          qIdNameResult = entityModel.qIdFunctionName;
        }
        return [props, keys, idNameResult, qIdNameResult];
      },
      [[], [], "", ""] as [Array<PropertyModel>, Array<string>, string, string]
    );
  }

  protected mapProp = (p: Property, entityPropConfig?: PropertyGenerationOptions | undefined): PropertyModel => {
    if (!p.$.Type) {
      throw new Error(`No type information given for property [${p.$.Name}]!`);
    }

    const configProp = this.serviceConfigHelper.findPropConfigByName(p.$.Name);
    const name = this.namingHelper.getModelPropName(entityPropConfig?.mappedName || configProp?.mappedName || p.$.Name);
    const isCollection = !!p.$.Type.match(/^Collection\(/);
    let dataType = p.$.Type.replace(/^Collection\(([^\)]+)\)/, "$1");

    // support for primitive type mapping
    if (this.namingHelper.includesServicePrefix(dataType)) {
      const dt = this.dataModel.getPrimitiveType(dataType);
      if (dt !== undefined) {
        dataType = dt;
      }
    }

    let result: Pick<PropertyModel, "dataType" | "type" | "typeModule" | "qPath" | "qParam" | "qObject" | "converters">;

    // domain object known from service:
    // EntityType, ComplexType, EnumType
    if (this.namingHelper.includesServicePrefix(dataType)) {
      const resultDt = this.model2Type.get(dataType)!;
      if (!resultDt) {
        throw new Error(
          `Couldn't determine model data type for property "${p.$.Name}"! Given data type: "${dataType}".`
        );
      }

      // special handling for enums
      if (resultDt === DataTypes.EnumType) {
        result = {
          dataType: resultDt,
          type: this.namingHelper.getEnumName(dataType),
          qPath: "QEnumPath",
          qObject: isCollection ? "QEnumCollection" : undefined,
          qParam: "QEnumParam",
        };
      }
      // handling of complex & entity types
      else {
        result = {
          dataType: resultDt,
          type: this.namingHelper.getModelName(dataType),
          qPath: "QEntityPath",
          qObject: this.namingHelper.getQName(dataType),
          qParam: "QComplexParam",
        };
      }
    }
    // OData built-in data types
    else if (dataType.startsWith(Digester.EDM_PREFIX)) {
      const { outputType, qPath, qParam, qCollection } = this.mapODataType(dataType);
      const { to, toModule: typeModule, converters } = this.dataModel.getConverter(dataType) || {};

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
        `Unknown type [${dataType}]: Not 'Collection(...)', not OData type 'Edm.*', not starting with one of the namespaces!W`
      );
    }

    return {
      odataName: p.$.Name,
      name,
      odataType: p.$.Type,
      fqType: dataType,
      required: p.$.Nullable === "false",
      isCollection: isCollection,
      managed: typeof entityPropConfig?.managed !== "undefined" ? entityPropConfig.managed : configProp?.managed,
      ...result,
    };
  };
}
