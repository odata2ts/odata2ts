import { camelCase } from "camel-case";
import { pascalCase } from "pascal-case";

import { RunOptions } from "../OptionModel";
import { DataModel } from "./DataModel";
import { ComplexType as ComplexModelType, DataTypes, ODataVersion, PropertyModel } from "./DataTypeModel";
import { ComplexType, EntityType, Property, Schema } from "./edmx/ODataEdmxModelBase";

const ID_SUFFIX = "Id";

export abstract class Digester<S extends Schema<ET, CT>, ET extends EntityType, CT extends ComplexType> {
  protected static EDM_PREFIX = "Edm.";
  protected static ROOT_OPERATION = "/";
  protected static PARAMS_MODEL_SUFFIX = "Params";

  protected readonly dataModel: DataModel;
  private model2Type: Map<string, DataTypes> = new Map<string, DataTypes>();

  protected constructor(protected version: ODataVersion, protected schema: S, protected options: RunOptions) {
    const serviceName = schema.$.Namespace;
    this.dataModel = new DataModel(version, serviceName, options.serviceName);
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
  protected abstract mapODataType(type: string): [string, string, string];

  public async digest(): Promise<DataModel> {
    this.digestSchema(this.schema);
    return this.dataModel;
  }

  protected getModelName(name: string, typeSuffix?: string): string {
    return (
      this.options.modelPrefix +
      pascalCase(this.stripServicePrefix(name)) +
      (typeSuffix || "") +
      this.options.modelSuffix
    );
  }

  protected getQName(name: string) {
    return `Q${pascalCase(this.stripServicePrefix(name))}`;
  }

  protected getEnumName(name: string) {
    return `${pascalCase(this.stripServicePrefix(name))}`;
  }

  protected getEntryPointName(name: string) {
    return camelCase(name);
  }

  protected stripServicePrefix(token: string) {
    return token.replace(new RegExp(this.dataModel.getServicePrefix()), "");
  }

  protected getOperationName(name: string) {
    return camelCase(this.stripServicePrefix(name));
  }

  protected getOperationParamsModelName(name: string) {
    return pascalCase(this.stripServicePrefix(name)) + Digester.PARAMS_MODEL_SUFFIX;
  }

  private collectModelTypes(schema: Schema<ET, CT>) {
    schema.EnumType?.forEach((et) => {
      this.model2Type.set(et.$.Name, DataTypes.EnumType);
    });
    schema.ComplexType?.forEach((ct) => {
      this.model2Type.set(ct.$.Name, DataTypes.ComplexType);
    });
    schema.EntityType?.forEach((et) => {
      this.model2Type.set(et.$.Name, DataTypes.ModelType);
    });
  }

  private digestSchema(schema: Schema<ET, CT>) {
    // enums
    if (schema.EnumType) {
      for (const et of schema.EnumType) {
        const name = et.$.Name;
        this.dataModel.addEnum(name, {
          odataName: name,
          name: this.getEnumName(name),
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
    const name = this.getModelName(model.$.Name);
    const qName = this.getQName(model.$.Name);
    const odataName = model.$.Name;
    const bType = model.$.BaseType;
    const props = [...(model.Property ?? []), ...this.getNavigationProps(model)];

    // support for base types, i.e. extends clause of interfaces
    const baseClasses = [];
    if (bType) {
      baseClasses.push(this.getModelName(bType));
    }

    return {
      name,
      qName,
      odataName,
      baseClasses,
      props: props.map(this.mapProperty),
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

      // key support
      // we cannot add keys now stemming from base classes
      // => postprocess required
      const keys: Array<string> = [];
      const entity = model as EntityType;
      if (entity.Key && entity.Key.length && entity.Key[0].PropertyRef.length) {
        const propNames = entity.Key[0].PropertyRef.map((key) => key.$.Name);
        keys.push(...propNames);
      }

      this.dataModel.addModel(baseModel.name, {
        ...baseModel,
        idFunctionName: this.getModelName(baseModel.name, ID_SUFFIX),
        keyNames: keys, // postprocess required to include key specs from base classes
        keys: [], // postprocess required to include props from base classes
        getKeyUnion: () => keys.join(" | "),
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
      const [baseProps, baseKeys] = this.collectBaseClassPropsAndKeys(model);
      model.baseProps = baseProps;
      model.keyNames.push(...baseKeys);

      // sanity check: entity types require key specification
      if (!model.keyNames.length) {
        throw new Error(`Key property is missing from Entity "${model.name}" (${model.odataName})!`);
      }

      const props = [...model.props, ...model.baseProps];
      model.keys = model.keyNames.map((keyName) => {
        const prop = props.find((p) => p.odataName === keyName);
        if (!prop) {
          throw new Error(`Key with name [${keyName}] not found in props!`);
        }
        return prop;
      });
    });
  }

  private collectBaseClassPropsAndKeys(model: ComplexModelType): [Array<PropertyModel>, Array<string>] {
    return model.baseClasses.reduce(
      ([props, keys], bc) => {
        const baseModel = this.dataModel.getModel(bc) || this.dataModel.getComplexType(bc);

        // recursive
        if (baseModel.baseClasses.length) {
          const [parentProps, parentKeys] = this.collectBaseClassPropsAndKeys(baseModel);
          props.push(...parentProps);
          keys.push(...parentKeys);
        }

        props.push(...baseModel.props);
        if (baseModel.keyNames) {
          keys.push(...baseModel.keyNames.filter((kn) => !keys.includes(kn)));
        }
        return [props, keys];
      },
      [[], []] as [Array<PropertyModel>, Array<string>]
    );
  }

  protected mapProperty = (p: Property): PropertyModel => {
    if (!p.$.Type) {
      throw new Error(`No type information given for property [${p.$.Name}]!`);
    }

    const isCollection = !!p.$.Type.match(/^Collection\(/);
    const dataType = p.$.Type.replace(/^Collection\(([^\)]+)\)/, "$1");

    let resultDt: DataTypes | undefined;
    let resultType: string;
    let resultQPath: string;
    let qClass: string | undefined;

    // domain object known from service: EntityType, ComplexType or EnumType
    if (dataType.startsWith(this.dataModel.getServicePrefix())) {
      resultDt = this.model2Type.get(this.stripServicePrefix(dataType));
      if (!resultDt) {
        throw new Error(`Couldn't determine model type for data type with name '${dataType}'`);
      }

      // special handling for enums
      if (resultDt === DataTypes.EnumType) {
        resultType = this.getEnumName(dataType);
        resultQPath = "QEnumPath";
        if (isCollection) {
          qClass = "QEnumCollection";
        }
      }
      // handling of complex & entity types
      else {
        resultType = this.getModelName(dataType);
        resultQPath = "QEntityPath";
        qClass = this.getQName(dataType);
      }
    }
    // OData built-in data types
    else if (dataType.startsWith(Digester.EDM_PREFIX)) {
      resultDt = DataTypes.PrimitiveType;
      const [type, qPath, qCollectionClass] = this.mapODataType(dataType);
      resultType = type;
      resultQPath = qPath;
      if (isCollection) {
        qClass = qCollectionClass;
      }
    } else {
      throw new Error(
        `Unknown type [${dataType}]: Not 'Collection(...)', not '${this.dataModel.getServicePrefix()}*', not OData type 'Edm.*'`
      );
    }

    const name = camelCase(p.$.Name);
    const odataName = p.$.Name;

    return {
      odataName,
      name,
      odataType: p.$.Type,
      type: resultType,
      qObject: qClass,
      qPath: resultQPath,
      dataType: resultDt!,
      required: p.$.Nullable === "false",
      isCollection: isCollection,
    };
  };
}
