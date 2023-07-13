import { MappedConverterChains } from "@odata2ts/converter-runtime";

import { DigestionOptions } from "../FactoryFunctionModel";
import { PropertyGenerationOptions } from "../OptionModel";
import { DataModel } from "./DataModel";
import { ComplexType as ComplexModelType, DataTypes, ModelType, ODataVersion, PropertyModel } from "./DataTypeModel";
import { ComplexType, EntityType, Property, Schema, TypeDefinition } from "./edmx/ODataEdmxModelBase";
import { SchemaV3 } from "./edmx/ODataEdmxModelV3";
import { SchemaV4 } from "./edmx/ODataEdmxModelV4";
import { NamingHelper } from "./NamingHelper";
import { ServiceConfigHelper } from "./ServiceConfigHelper";

export interface TypeModel {
  outputType: string;
  qPath: string;
  qCollection: string;
  qParam: string | undefined;
}

export abstract class Digester<S extends Schema<ET, CT>, ET extends EntityType, CT extends ComplexType> {
  protected static EDM_PREFIX = "Edm.";
  protected static ROOT_OPERATION = "/";

  protected readonly dataModel: DataModel;
  protected readonly serviceConfigHelper: ServiceConfigHelper;

  private model2Type: Map<string, DataTypes> = new Map<string, DataTypes>();

  protected constructor(
    protected version: ODataVersion,
    protected schemas: Array<S>,
    protected options: DigestionOptions,
    protected namingHelper: NamingHelper,
    converters?: MappedConverterChains
  ) {
    this.dataModel = new DataModel(version, converters);
    this.serviceConfigHelper = new ServiceConfigHelper(options);

    this.collectModelTypes(schemas);
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

  private collectModelTypes(schemas: Array<S>) {
    schemas.forEach((schema) => {
      const servicePrefix = schema.$.Namespace + ".";

      schema.EnumType?.forEach((et) => {
        this.model2Type.set(servicePrefix + et.$.Name, DataTypes.EnumType);
      });
      schema.ComplexType?.forEach((ct) => {
        this.model2Type.set(servicePrefix + ct.$.Name, DataTypes.ComplexType);
      });
      schema.EntityType?.forEach((et) => {
        this.model2Type.set(servicePrefix + et.$.Name, DataTypes.ModelType);
      });
    });
  }

  private digestEntityTypesAndOperations() {
    this.schemas.forEach((schema) => {
      // type definitions: alias for primitive types
      this.addTypeDefinition(schema.TypeDefinition);

      // enums
      if (schema.EnumType) {
        for (const et of schema.EnumType) {
          const name = et.$.Name;
          this.dataModel.addEnum(name, {
            odataName: name,
            name: this.namingHelper.getEnumName(name),
            members: et.Member.map((m) => m.$.Name),
          });
        }
      }

      // entity types
      this.addEntityType(schema.EntityType);
      // complex types
      this.addComplexType(schema.ComplexType);

      // V4 only: function & action types
      this.digestOperations(schema);
    });

    this.postProcessModel();
  }

  private getBaseModel(model: ComplexType) {
    const entityConfig = this.serviceConfigHelper.findConfigEntityByName(model.$.Name);
    const entityName = entityConfig?.mappedName || model.$.Name;

    const name = this.namingHelper.getModelName(entityName);
    const qName = this.namingHelper.getQName(entityName);
    const editableName = this.namingHelper.getEditableModelName(entityName);
    const odataName = model.$.Name;
    const bType = model.$.BaseType;
    const props = [...(model.Property ?? []), ...this.getNavigationProps(model)];

    // support for base types, i.e. extends clause of interfaces
    const baseClasses = [];
    if (bType) {
      baseClasses.push(this.namingHelper.getModelName(bType));
    }

    return {
      name,
      qName,
      odataName,
      editableName,
      baseClasses,
      props: props.map((p) => {
        const epConfig = entityConfig?.properties?.find((ep) => ep.name === p.$.Name);
        return this.mapProp(p, epConfig);
      }),
      baseProps: [], // postprocess required
    };
  }

  private addTypeDefinition(types: Array<TypeDefinition> | undefined) {
    if (!types || !types.length) {
      return;
    }

    for (const t of types) {
      this.dataModel.addTypeDefinition(t.$.Name, t.$.UnderlyingType);
    }
  }

  private addComplexType(models: Array<ComplexType> | undefined) {
    if (!models || !models.length) {
      return;
    }

    for (const model of models) {
      const baseModel = this.getBaseModel(model);
      this.dataModel.addComplexType(baseModel.name, baseModel);
    }
  }

  private addEntityType(models: Array<ET> | undefined) {
    if (!models || !models.length) {
      return;
    }

    for (const model of models) {
      const baseModel = this.getBaseModel(model);
      const entityConfig = this.serviceConfigHelper.findConfigEntityByName(model.$.Name);
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

      this.dataModel.addModel(baseModel.name, {
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
    const modelTypes = this.dataModel.getModels();
    // entity types
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

    const sortedModelTypes = this.sortModelsByInheritance<ModelType>(modelTypes);
    this.dataModel.setModels(sortedModelTypes);

    const sortedComplexTypes = this.sortModelsByInheritance<ComplexModelType>(complexTypes);
    this.dataModel.setComplexTypes(sortedComplexTypes);
  }

  private sortModelsByInheritance<Type extends ComplexModelType>(models: Type[]): { [name: string]: Type } {
    // recursively visit all models and sort them by inheritance such that base classes
    // are always before derived classes
    const sortedModels: { [name: string]: Type } = {};
    const visitedModels = new Set<Type>();
    const inProgressModels = new Set<Type>();

    function visit(model: Type) {
      if (inProgressModels.has(model)) {
        throw new Error("Cyclic dependencies detected!");
      }

      if (!visitedModels.has(model)) {
        inProgressModels.add(model);

        for (const baseClassName of model.baseClasses) {
          const baseClass = models.find((e) => e.name === baseClassName);
          if (baseClass) {
            visit(baseClass);
          }
        }
        visitedModels.add(model);
        inProgressModels.delete(model);
        sortedModels[model.name] = model;
      }
    }

    for (const model of models) {
      visit(model);
    }
    return sortedModels;
  }

  private collectBaseClassPropsAndKeys(
    model: ComplexModelType,
    visitedModels: string[]
  ): [Array<PropertyModel>, Array<string>, string, string] {
    if (visitedModels.includes(model.name)) {
      throw new Error(`Cyclic inheritance detected for model ${model.name}!`);
    }
    visitedModels.push(model.name);
    return model.baseClasses.reduce(
      ([props, keys, idName, qIdName], bc) => {
        const baseModel = this.dataModel.getModel(bc) || this.dataModel.getComplexType(bc);
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
        if (baseModel.keyNames?.length) {
          keys.push(...baseModel.keyNames.filter((kn) => !keys.includes(kn)));
          idNameResult = baseModel.idModelName;
          qIdNameResult = baseModel.qIdFunctionName;
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

    const configProp = this.serviceConfigHelper.findConfigPropByName(p.$.Name);
    const name = this.namingHelper.getModelPropName(entityPropConfig?.mappedName || configProp?.mappedName || p.$.Name);
    const isCollection = !!p.$.Type.match(/^Collection\(/);
    let dataType = p.$.Type.replace(/^Collection\(([^\)]+)\)/, "$1");
    if (this.namingHelper.includesServicePrefix(dataType)) {
      const dtName = this.namingHelper.stripServicePrefix(dataType);
      if (this.dataModel.getPrimitiveType(dtName) !== undefined) {
        dataType = this.dataModel.getPrimitiveType(dtName)!;
      }
    }

    let result: Pick<PropertyModel, "dataType" | "type" | "typeModule" | "qPath" | "qParam" | "qObject" | "converters">;

    // domain object known from service:
    // EntityType, ComplexType, EnumType
    if (this.namingHelper.includesServicePrefix(dataType)) {
      const resultDt = this.model2Type.get(dataType);
      if (!resultDt) {
        throw new Error(`Couldn't determine model type for data type with name '${dataType}'`);
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
      required: p.$.Nullable === "false",
      isCollection: isCollection,
      managed: typeof entityPropConfig?.managed !== "undefined" ? entityPropConfig.managed : configProp?.managed,
      ...result,
    };
  };
}
