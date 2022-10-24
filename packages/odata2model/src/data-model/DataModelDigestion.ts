import { MappedConverterChains } from "@odata2ts/converter-runtime";
import { camelCase } from "camel-case";
import { pascalCase } from "pascal-case";

import { DigestionOptions } from "../FactoryFunctionModel";
import { DataModel } from "./DataModel";
import { ComplexType as ComplexModelType, DataTypes, ODataVersion, PropertyModel } from "./DataTypeModel";
import { ComplexType, EntityType, Property, Schema } from "./edmx/ODataEdmxModelBase";

const ID_SUFFIX = "Id";

export interface TypeModel {
  outputType: string;
  qPath: string;
  qCollection: string;
  qParam: string | undefined;
}

export abstract class Digester<S extends Schema<ET, CT>, ET extends EntityType, CT extends ComplexType> {
  protected static EDM_PREFIX = "Edm.";
  protected static ROOT_OPERATION = "/";
  protected static PARAMS_MODEL_SUFFIX = "Params";

  protected readonly dataModel: DataModel;
  private model2Type: Map<string, DataTypes> = new Map<string, DataTypes>();

  protected constructor(
    protected version: ODataVersion,
    protected schema: S,
    protected options: DigestionOptions,
    converters?: MappedConverterChains
  ) {
    const serviceName = schema.$.Namespace;
    this.dataModel = new DataModel(version, serviceName, options.serviceName, converters);
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

  protected getModelName(name: string, typeSuffix?: string): string {
    return (
      (this.options.models.prefix || "") +
      pascalCase(this.stripServicePrefix(name)) +
      (typeSuffix || "") +
      (this.options.models.suffix || "")
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

  protected getQOperationName(name: string) {
    return `Q${pascalCase(this.getOperationName(name))}`;
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

      const idModelName = this.getModelName(baseModel.name, ID_SUFFIX);
      this.dataModel.addModel(baseModel.name, {
        ...baseModel,
        idModelName,
        qIdFunctionName: `Q${idModelName}`,
        generateId: true,
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

      const props = [...model.baseProps, ...model.props];
      model.keys = model.keyNames.map((keyName) => {
        const prop = props.find((p) => p.odataName === keyName);
        if (!prop) {
          throw new Error(`Key with name [${keyName}] not found in props!`);
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

  protected mapProperty = (p: Property): PropertyModel => {
    if (!p.$.Type) {
      throw new Error(`No type information given for property [${p.$.Name}]!`);
    }

    const isCollection = !!p.$.Type.match(/^Collection\(/);
    const dataType = p.$.Type.replace(/^Collection\(([^\)]+)\)/, "$1");

    let result: Pick<PropertyModel, "dataType" | "type" | "typeModule" | "qPath" | "qParam" | "qObject" | "converters">;

    // domain object known from service:
    // EntityType, ComplexType or EnumType
    if (dataType.startsWith(this.dataModel.getServicePrefix())) {
      const resultDt = this.model2Type.get(this.stripServicePrefix(dataType));
      if (!resultDt) {
        throw new Error(`Couldn't determine model type for data type with name '${dataType}'`);
      }

      // special handling for enums
      if (resultDt === DataTypes.EnumType) {
        result = {
          dataType: resultDt,
          type: this.getEnumName(dataType),
          qPath: "QEnumPath",
          qObject: isCollection ? "QEnumCollection" : undefined,
        };
      }
      // handling of complex & entity types
      else {
        result = {
          dataType: resultDt,
          type: this.getModelName(dataType),
          qPath: "QEntityPath",
          qObject: this.getQName(dataType),
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
        `Unknown type [${dataType}]: Not 'Collection(...)', not '${this.dataModel.getServicePrefix()}*', not OData type 'Edm.*'`
      );
    }

    const name = camelCase(p.$.Name);
    const odataName = p.$.Name;

    return {
      odataName,
      name,
      odataType: p.$.Type,
      required: p.$.Nullable === "false",
      isCollection: isCollection,
      ...result,
    };
  };
}
