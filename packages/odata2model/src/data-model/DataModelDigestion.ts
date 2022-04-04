import { DataModel } from "./DataModel";
import {
  Action,
  ComplexType,
  EntityContainer,
  EntityType,
  Function,
  NavigationProperty,
  OdataTypes,
  Property,
  Schema,
} from "./edmx/ODataEdmxModel";
import { RunOptions } from "../OptionModel";
import { upperCaseFirst } from "upper-case-first";
import { firstCharLowerCase } from "xml2js/lib/processors";
import { DataTypes, ModelType, ModelTypes, OperationType, OperationTypes, PropertyModel } from "./DataTypeModel";

/**
 * Takes an EDMX schema
 * @param schema
 * @param options
 */
export async function digest(schema: Schema, options: RunOptions): Promise<DataModel> {
  const digester = new Digester(schema, options);
  return digester.digest();
}

const EDM_PREFIX = "Edm.";
const ROOT_OPERATION = "/";

class Digester {
  private readonly dataModel: DataModel;

  constructor(private schema: Schema, private options: RunOptions) {
    const serviceName = schema.$.Namespace;
    this.dataModel = new DataModel(serviceName);
  }

  public async digest(): Promise<DataModel> {
    this.digestSchema(this.schema);
    return this.dataModel;
  }

  private getModelName(name: string) {
    return `${this.options.modelPrefix}${upperCaseFirst(this.stripServicePrefix(name))}${this.options.modelSuffix}`;
  }

  private getQName(name: string) {
    return `q${upperCaseFirst(this.stripServicePrefix(name))}`;
  }

  private getEnumName(name: string) {
    return `${upperCaseFirst(name)}`;
  }

  private getOperationName(name: string) {
    return firstCharLowerCase(this.stripServicePrefix(name));
  }

  private getEntryPointName(name: string) {
    return firstCharLowerCase(name);
  }

  private stripServicePrefix(token: string) {
    return token.replace(new RegExp(this.dataModel.getServicePrefix()), "");
  }

  private digestSchema(schema: Schema) {
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

    // functions, actions, EntitySet, Singleton
    this.addOperations(schema.Function, OperationTypes.Function);
    this.addOperations(schema.Action, OperationTypes.Action);

    if (schema.EntityContainer && schema.EntityContainer.length) {
      this.digestEntityContainer(schema.EntityContainer[0]);
    }
  }

  private addModel(models: Array<EntityType | ComplexType> | undefined, modelType: ModelTypes) {
    if (!models || !models.length) {
      return;
    }

    models.forEach((model) => {
      const name = this.getModelName(model.$.Name);
      const bType = model.$.BaseType;
      const props = [...(model.Property ?? []), ...(model.NavigationProperty ?? [])];

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

  private mapProperty = (p: Property | NavigationProperty): PropertyModel => {
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
    else if (dataType.startsWith(EDM_PREFIX)) {
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

  private mapODataType(type: string): string {
    switch (type) {
      case OdataTypes.Boolean:
        return "boolean";
      case OdataTypes.Byte:
      case OdataTypes.SByte:
      case OdataTypes.Int16:
      case OdataTypes.Int32:
      case OdataTypes.Int64:
      case OdataTypes.Decimal:
      case OdataTypes.Double:
      case OdataTypes.Single:
        return "number";
      case OdataTypes.String:
        return "string";
      case OdataTypes.Date:
        const dateType = "DateString";
        this.dataModel.addPrimitiveTypeImport(dateType);
        return dateType;
      case OdataTypes.Time:
        const timeType = "TimeOfDayString";
        this.dataModel.addPrimitiveTypeImport(timeType);
        return timeType;
      case OdataTypes.DateTimeOffset:
        const dateTimeType = "DateTimeOffsetString";
        this.dataModel.addPrimitiveTypeImport(dateTimeType);
        return dateTimeType;
      case OdataTypes.Binary:
        const binaryType = "BinaryString";
        this.dataModel.addPrimitiveTypeImport(binaryType);
        return binaryType;
      case OdataTypes.Guid:
        const guidType = "GuidString";
        this.dataModel.addPrimitiveTypeImport(guidType);
        return guidType;
      default:
        return "string";
    }
  }

  private addOperations(operations: Array<Function | Action> | undefined, type: OperationTypes) {
    if (!operations || !operations.length) {
      return;
    }

    operations.forEach((op) => {
      const params: Array<PropertyModel> = op.Parameter?.map(this.mapProperty) ?? [];
      const returnType: PropertyModel | undefined = op.ReturnType?.map((rt) => {
        return this.mapProperty({ ...rt, $: { Name: "NO_NAME_BECAUSE_RETURN_TYPE", ...rt.$ } });
      })[0];
      const isBound = op.$.IsBound === "true";

      if (isBound && !params.length) {
        throw Error(`IllegalState: Operation '${op.$.Name}' is bound, but has no parameters!`);
      }

      const bindingProp = isBound ? params.shift() : undefined;
      const binding = bindingProp ? bindingProp.type : ROOT_OPERATION;
      this.dataModel.addOperationType(binding, {
        odataName: op.$.Name,
        name: this.getOperationName(op.$.Name),
        type: type,
        parameters: params,
        returnType: returnType,
      });
    });
  }

  private digestEntityContainer(container: EntityContainer) {
    container.ActionImport?.forEach((actionImport) => {
      const name = this.getOperationName(actionImport.$.Name);
      const operationName = this.getOperationName(actionImport.$.Action);

      this.dataModel.addAction(name, {
        name: name,
        odataName: actionImport.$.Name,
        operation: this.getRootOperationType(operationName),
      });
    });

    container.FunctionImport?.forEach((funcImport) => {
      const name = this.getOperationName(funcImport.$.Name);
      const operationName = this.getOperationName(funcImport.$.Function);

      this.dataModel.addFunction(name, {
        name,
        odataName: funcImport.$.Name,
        operation: this.getRootOperationType(operationName),
        entitySet: funcImport.$.EntitySet,
      });
    });

    container.Singleton?.forEach((singleton) => {
      const name = this.getEntryPointName(singleton.$.Name);
      const navPropBindings = singleton.NavigationPropertyBinding || [];

      this.dataModel.addSingleton(name, {
        name,
        odataName: singleton.$.Name,
        type: this.dataModel.getModel(this.getModelName(singleton.$.Type)),
        navPropBinding: navPropBindings.map((binding) => ({
          path: this.stripServicePrefix(binding.$.Path),
          target: binding.$.Target,
        })),
      });
    });

    container.EntitySet?.forEach((entitySet) => {
      const name = this.getEntryPointName(entitySet.$.Name);
      const navPropBindings = entitySet.NavigationPropertyBinding || [];

      this.dataModel.addEntitySet(name, {
        name,
        odataName: entitySet.$.Name,
        entityType: this.dataModel.getModel(this.getModelName(entitySet.$.EntityType)),
        navPropBinding: navPropBindings.map((binding) => ({
          path: this.stripServicePrefix(binding.$.Path),
          target: binding.$.Target,
        })),
      });
    });
  }

  private getRootOperationType(name: string): OperationType {
    const rootOps = this.dataModel.getOperationTypeByBinding(ROOT_OPERATION);
    const rootOp = rootOps.find((op) => op.name === name);
    if (!rootOp) {
      throw Error(`Couldn't find root operation with name [${name}]`);
    }
    return rootOp;
  }
}
