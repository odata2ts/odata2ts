import { firstCharLowerCase } from "xml2js/lib/processors";
import { upperCaseFirst } from "upper-case-first";

import { DataModel } from "./DataModel";
import { ComplexType, EntityType, Property, Schema } from "./edmx/ODataEdmxModelBase";
import { RunOptions } from "../OptionModel";
import { DataTypes, ModelType, ModelTypes, PropertyModel } from "./DataTypeModel";

export abstract class Digester<S extends Schema<ET, CT>, ET extends EntityType, CT extends ComplexType> {
  protected static EDM_PREFIX = "Edm.";
  protected static ROOT_OPERATION = "/";

  protected readonly dataModel: DataModel;

  protected constructor(protected schema: S, protected options: RunOptions) {
    const serviceName = schema.$.Namespace;
    this.dataModel = new DataModel(serviceName);
  }

  public async digest(): Promise<DataModel> {
    this.digestSchema(this.schema);
    return this.dataModel;
  }

  protected abstract getNavigationProps(entityType: ET | ComplexType): Array<Property>;

  protected abstract digestEntityContainer(): void;

  protected abstract mapODataType(type: string): string;

  protected getModelName(name: string) {
    return `${this.options.modelPrefix}${upperCaseFirst(this.stripServicePrefix(name))}${this.options.modelSuffix}`;
  }

  protected getQName(name: string) {
    return `q${upperCaseFirst(this.stripServicePrefix(name))}`;
  }

  protected getEnumName(name: string) {
    return `${upperCaseFirst(name)}`;
  }

  protected getEntryPointName(name: string) {
    return firstCharLowerCase(name);
  }

  protected stripServicePrefix(token: string) {
    return token.replace(new RegExp(this.dataModel.getServicePrefix()), "");
  }

  protected getOperationName(name: string) {
    return firstCharLowerCase(this.stripServicePrefix(name));
  }

  private digestSchema(schema: Schema<ET, CT>) {
    // enums
    schema.EnumType?.forEach((et) => {
      const name = et.$.Name;
      this.dataModel.addEnum(name, {
        odataName: name,
        name: this.getEnumName(name),
        members: et.Member.map((m) => m.$.Name),
      });
    });

    // entity types & complex types
    this.addModel(schema.EntityType, ModelTypes.EntityType);
    this.addModel(schema.ComplexType, ModelTypes.ComplexType);
    this.postProcessModel();

    // delegate to concrete entity container digestion
    this.digestEntityContainer();
  }

  private addModel(models: Array<ET | ComplexType> | undefined, modelType: ModelTypes) {
    if (!models || !models.length) {
      return;
    }

    models.forEach((model) => {
      const name = this.getModelName(model.$.Name);
      const bType = model.$.BaseType;
      const props = [...(model.Property ?? []), ...this.getNavigationProps(model)];

      // support for base types, i.e. extends clause of interfaces
      const baseTypes = [];
      if (bType) {
        baseTypes.push(this.getModelName(bType));
      }

      // key support
      // we cannot add keys now stemming from base classes
      // => postprocess required
      const keys: Array<string> = [];
      if (modelType === ModelTypes.EntityType) {
        const entity = model as EntityType;
        if (entity.Key && entity.Key.length && entity.Key[0].PropertyRef.length) {
          const propNames = entity.Key[0].PropertyRef.map((key) => key.$.Name);
          keys.push(...propNames);
        }
      }

      this.dataModel.addModel(name, {
        modelType,
        name,
        qName: this.getQName(model.$.Name),
        odataName: model.$.Name,
        baseClasses: baseTypes,
        keyNames: keys, // postprocess required to include key specs from base classes
        keys: [], // postprocess required to include props from base classes
        props: props.map(this.mapProperty),
        baseProps: [], // postprocess required
        getKeyUnion: () => keys.join(" | "),
      });
    });
  }

  private postProcessModel() {
    this.dataModel.getModels().forEach((model) => {
      const [baseProps, baseKeys] = this.collectBaseClassPropsAndKeys(model);
      model.baseProps = baseProps;
      model.keyNames.push(...baseKeys);

      if (model.modelType === ModelTypes.EntityType) {
        // sanity check: entity types require key specification
        if (!model.keyNames.length) {
          throw Error(`Key property is missing from Entity "${model.name}" (${model.odataName})!`);
        }

        const props = [...model.props, ...model.baseProps];
        model.keys = model.keyNames.map((keyName) => {
          const prop = props.find((p) => p.odataName === keyName);
          if (!prop) {
            throw Error(`Key with name [${keyName}] not found in props!`);
          }
          return prop;
        });
      }
    });
  }

  private collectBaseClassPropsAndKeys(model: ModelType): [Array<PropertyModel>, Array<string>] {
    return model.baseClasses.reduce(
      ([props, keys], bc) => {
        const baseModel = this.dataModel.getModel(bc);

        // recursive
        if (baseModel.baseClasses.length) {
          const [parentProps, parentKeys] = this.collectBaseClassPropsAndKeys(baseModel);
          props.push(...parentProps);
          keys.push(...parentKeys);
        }

        props.push(...baseModel.props);
        keys.push(...baseModel.keyNames.filter((kn) => !keys.includes(kn)));
        return [props, keys];
      },
      [[], []] as [Array<PropertyModel>, Array<string>]
    );
  }

  protected mapProperty = (p: Property): PropertyModel => {
    if (!p.$.Type) {
      throw Error(`No type information given for property [${p.$.Name}]!`);
    }

    const isCollection = !!p.$.Type.match(/^Collection\(/);
    const dataType = p.$.Type.replace(/^Collection\(([^\)]+)\)/, "$1");

    let resultType: string;
    let resultDt: DataTypes;
    let qEntityInstance: string | undefined;

    // domain object known from service, e.g. EntitySet, EnumType, ...
    if (dataType.startsWith(this.dataModel.getServicePrefix())) {
      const newType = this.stripServicePrefix(dataType);
      const enumType = this.dataModel.getEnum(newType);

      // special handling for enums
      if (enumType) {
        resultType = enumType.name;
        resultDt = DataTypes.EnumType;
        if (isCollection) {
          qEntityInstance = "qEnumCollection";
        }
      }
      // handling of models
      else {
        resultType = this.getModelName(newType);
        qEntityInstance = this.getQName(newType);
        resultDt = DataTypes.ModelType;
      }
    }
    // OData built-in data types
    else if (dataType.startsWith(Digester.EDM_PREFIX)) {
      resultType = this.mapODataType(dataType);
      resultDt = DataTypes.PrimitiveType;
      if (isCollection) {
        qEntityInstance = `q${upperCaseFirst(resultType)}Collection`;
      }
    } else {
      throw new Error(
        `Unknown type [${dataType}]: Not 'Collection(...)', not '${this.dataModel.getServicePrefix()}*', not OData type 'Edm.*'`
      );
    }

    return {
      odataName: p.$.Name,
      name: p.$.Name === "ID" ? "id" : firstCharLowerCase(p.$.Name),
      odataType: p.$.Type,
      type: resultType,
      qObject: qEntityInstance,
      dataType: resultDt,
      required: p.$.Nullable === "false",
      isCollection: isCollection,
    };
  };
}
