import { MappedConverterChains } from "@odata2ts/converter-runtime";

import { DigestionOptions } from "../FactoryFunctionModel";
import { DataModel } from "./DataModel";
import { ComplexType as ComplexModelType, DataTypes, ODataVersion, PropertyModel } from "./DataTypeModel";
import { ComplexType, EntityType, Property, Schema } from "./edmx/ODataEdmxModelBase";
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
    protected schema: S,
    protected options: DigestionOptions,
    protected namingHelper: NamingHelper,
    converters?: MappedConverterChains
  ) {
    this.dataModel = new DataModel(version, converters);
    this.serviceConfigHelper = new ServiceConfigHelper(options);
    this.collectModelTypes(this.schema);
  }

  protected abstract getNavigationProps(entityType: ET | ComplexType): Array<Property>;

  protected abstract digestEntityContainer(): void;

  /**
   * Get essential infos about a given odata type from the version specific service variants.
   *
   * @param type
   * @return tuple of return type, query object, query collection object
   */
  protected abstract mapODataType(type: string): TypeModel;

  public async digest(): Promise<DataModel> {
    this.digestSchema(this.schema);
    return this.dataModel;
  }

  private collectModelTypes(schema: Schema<ET, CT>) {
    const servicePrefix = this.namingHelper.getServicePrefix();
    schema.EnumType?.forEach((et) => {
      this.model2Type.set(servicePrefix + et.$.Name, DataTypes.EnumType);
    });
    schema.ComplexType?.forEach((ct) => {
      this.model2Type.set(servicePrefix + ct.$.Name, DataTypes.ComplexType);
    });
    schema.EntityType?.forEach((et) => {
      this.model2Type.set(servicePrefix + et.$.Name, DataTypes.ModelType);
    });
  }

  private digestSchema(schema: Schema<ET, CT>) {
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

    this.postProcessModel();

    // delegate to concrete entity container digestion
    this.digestEntityContainer();
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
      props: props.map(this.mapProp),
      baseProps: [], // postprocess required
    };
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
    this.dataModel.getComplexTypes().forEach((model) => {
      const [baseProps] = this.collectBaseClassPropsAndKeys(model);
      model.baseProps = baseProps;
    });
    // entity types
    this.dataModel.getModels().forEach((model) => {
      const [baseProps, baseKeys, idName, qIdName] = this.collectBaseClassPropsAndKeys(model);
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

  private collectBaseClassPropsAndKeys(model: ComplexModelType): [Array<PropertyModel>, Array<string>, string, string] {
    return model.baseClasses.reduce(
      ([props, keys, idName, qIdName], bc) => {
        const baseModel = this.dataModel.getModel(bc) || this.dataModel.getComplexType(bc);
        let idNameResult = idName;
        let qIdNameResult = qIdName;

        // recursive
        if (baseModel.baseClasses.length) {
          const [parentProps, parentKeys, parentIdName, parentQIdName] = this.collectBaseClassPropsAndKeys(baseModel);
          props.unshift(...parentProps);
          keys.unshift(...parentKeys);
          if (parentIdName) {
            idNameResult = parentIdName;
            qIdNameResult = parentQIdName;
          }
        }

        props.push(...baseModel.props);
        if (baseModel.keyNames) {
          keys.push(...baseModel.keyNames.filter((kn) => !keys.includes(kn)));
          idNameResult = baseModel.idModelName;
          qIdNameResult = baseModel.qIdFunctionName;
        }
        return [props, keys, idNameResult, qIdNameResult];
      },
      [[], [], "", ""] as [Array<PropertyModel>, Array<string>, string, string]
    );
  }

  protected mapProp = (p: Property): PropertyModel => {
    if (!p.$.Type) {
      throw new Error(`No type information given for property [${p.$.Name}]!`);
    }

    const isCollection = !!p.$.Type.match(/^Collection\(/);
    const dataType = p.$.Type.replace(/^Collection\(([^\)]+)\)/, "$1");
    const configProp = this.serviceConfigHelper.findConfigPropByName(p.$.Name);
    const name = this.namingHelper.getModelPropName(configProp?.mappedName || p.$.Name);

    let result: Pick<PropertyModel, "dataType" | "type" | "typeModule" | "qPath" | "qParam" | "qObject" | "converters">;

    // domain object known from service:
    // EntityType, ComplexType or EnumType
    if (dataType.startsWith(this.namingHelper.getServicePrefix())) {
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
        `Unknown type [${dataType}]: Not 'Collection(...)', not '${this.namingHelper.getServicePrefix()}*', not OData type 'Edm.*'`
      );
    }

    return {
      odataName: p.$.Name,
      name,
      odataType: p.$.Type,
      required: p.$.Nullable === "false",
      isCollection: isCollection,
      managed: configProp?.managed,
      ...result,
    };
  };
}
