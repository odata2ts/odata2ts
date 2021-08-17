import { upperCaseFirst } from "upper-case-first";
import { firstCharLowerCase } from "xml2js/lib/processors";

import { RunOptions } from "../OptionModel";
import {
  Property,
  NavigationProperty,
  Schema,
  OdataTypes,
  Action,
  Function,
  EntityContainer,
  EntityType,
  ComplexType,
} from "../odata/ODataEdmxModel";
import {
  ModelType,
  EnumType,
  DataTypes,
  PropertyModel,
  EntityContainerModel,
  OperationType,
  OperationTypes,
  ModelTypes,
} from "./DataTypeModel";

const EDM_PREFIX = "Edm.";
const ROOT_OPERATION = "/";
/**
 * EntityType, ComplexType, EnumType, PrimitiveType
 */
// export interface DataModel {}

export class DataModel {
  private serviceName: string;
  private servicePrefix: string;

  private fileNames = {
    model: "",
    qObject: "",
    service: "",
  };

  // combines entity & complex types
  private modelTypes: { [name: string]: ModelType } = {};
  private enumTypes: { [name: string]: EnumType } = {};
  // combines functions & actions
  private operationTypes: { [binding: string]: Array<OperationType> } = {};
  private container: EntityContainerModel = { entitySets: {}, singletons: {}, functions: {}, actions: {} };

  // imports of custom dataTypes which are represented at strings,
  // e.g. DateString, GuidString, etc.
  private primitiveTypeImports: Set<string> = new Set();

  constructor(schema: Schema, private options: RunOptions) {
    this.serviceName = schema.$.Namespace;
    this.servicePrefix = this.serviceName + ".";

    const name = upperCaseFirst(this.serviceName);
    this.fileNames = {
      model: `${name}Model`,
      qObject: `Q${name}`,
      service: `${name}${name.endsWith("Service") ? "" : "Service"}`,
    };

    this.digestSchema(schema);
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
    return token.replace(new RegExp(this.servicePrefix), "");
  }

  private digestSchema(schema: Schema) {
    // enums
    schema.EnumType?.forEach((et) => {
      const name = et.$.Name;
      this.enumTypes[name] = {
        odataName: name,
        name: this.getEnumName(name),
        members: et.Member.map((m) => m.$.Name),
      };
    });

    // entity types & complex types
    this.addModel(schema.EntityType, ModelTypes.EntityType);
    this.addModel(schema.ComplexType, ModelTypes.ComplexType);
    this.postProcessModel();

    // functions, actions, EntitySet, Singleton
    this.addOperations(schema.Function, OperationTypes.Function);
    this.addOperations(schema.Action, OperationTypes.Action);
    this.digestEntityContainer(schema.EntityContainer[0]);
  }

  private addModel(models: Array<EntityType | ComplexType>, modelType: ModelTypes) {
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

      this.modelTypes[name] = {
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
      };
    });
  }

  private postProcessModel() {
    Object.values(this.modelTypes).forEach((model) => {
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
        const baseModel = this.getModel(bc);

        // recursiveness
        if (baseModel.baseClasses.length) {
          const [parentProps, parentKeys] = this.collectBaseClassPropsAndKeys(baseModel);
          props.push(...parentProps);
          keys.push(...parentKeys);
        }

        props.push(...baseModel.props);
        keys.push(...baseModel.keyNames);
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
    if (dataType.startsWith(this.servicePrefix)) {
      const newType = this.stripServicePrefix(dataType);
      const enumType = this.enumTypes[newType];

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
      throw Error(
        `Unknown type [${dataType}]: Not 'Collection(...)', not '${this.servicePrefix}*', not OData type 'Edm.*'`
      );
    }

    return {
      odataName: p.$.Name,
      name: firstCharLowerCase(p.$.Name),
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
        this.primitiveTypeImports.add(dateType);
        return dateType;
      case OdataTypes.Time:
        const timeType = "TimeOfDayString";
        this.primitiveTypeImports.add(timeType);
        return timeType;
      case OdataTypes.DateTimeOffset:
        const dateTimeType = "DateTimeOffsetString";
        this.primitiveTypeImports.add(dateTimeType);
        return dateTimeType;
      case OdataTypes.Binary:
        const binaryType = "BinaryString";
        this.primitiveTypeImports.add(binaryType);
        return binaryType;
      case OdataTypes.Guid:
        const guidType = "GuidString";
        this.primitiveTypeImports.add(guidType);
        return guidType;
      default:
        return "string";
    }
  }

  private addOperations(operations: Array<Function | Action>, type: OperationTypes) {
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
      if (!this.operationTypes[binding]) {
        this.operationTypes[binding] = [];
      }

      this.operationTypes[binding].push({
        odataName: op.$.Name,
        name: this.getOperationName(op.$.Name),
        type: type,
        parameters: params,
        returnType: returnType,
      });
    });
  }

  private digestEntityContainer(container: EntityContainer) {
    const { actions, functions, singletons, entitySets } = this.container;

    container.ActionImport?.forEach((actionImport) => {
      const name = this.getOperationName(actionImport.$.Name);
      const operationName = this.getOperationName(actionImport.$.Action);

      actions[name] = {
        name: name,
        odataName: actionImport.$.Name,
        operation: this.getRootOperationType(operationName),
      };
    });

    container.FunctionImport?.forEach((funcImport) => {
      const name = this.getOperationName(funcImport.$.Name);
      const operationName = this.getOperationName(funcImport.$.Function);

      functions[name] = {
        name,
        odataName: funcImport.$.Name,
        operation: this.getRootOperationType(operationName),
        entitySet: funcImport.$.EntitySet,
      };
    });

    container.Singleton?.forEach((singleton) => {
      const name = this.getEntryPointName(singleton.$.Name);
      singletons[name] = {
        name,
        odataName: singleton.$.Name,
        type: this.getModel(this.getModelName(singleton.$.Type)),
      };
    });

    container.EntitySet?.forEach((entitySet) => {
      const name = this.getEntryPointName(entitySet.$.Name);

      entitySets[name] = {
        name,
        odataName: entitySet.$.Name,
        entityType: this.getModel(this.getModelName(entitySet.$.EntityType)),
        navPropBinding: entitySet.NavigationPropertyBinding?.map((binding) => ({
          path: this.stripServicePrefix(binding.$.Path),
          target: binding.$.Target,
        })),
      };
    });
  }

  /**
   * The service name.
   * @returns
   */
  public getServiceName() {
    return this.serviceName;
  }

  /**
   * The prefix used to reference model or enum types in this schema.
   * @returns service prefix
   */
  public getServicePrefix() {
    return this.servicePrefix;
  }

  public getFileNames() {
    return { ...this.fileNames };
  }

  /**
   * Get a specific model by its name.
   *
   * @param modelName the final model name that is generated
   * @returns the model type
   */
  public getModel(modelName: string) {
    return this.modelTypes[modelName];
  }

  /**
   * Retrieve all knwon models, i.e. EntityType and ComplexType nodes from the EDMX model.
   *
   * @returns list of model types
   */
  public getModels() {
    return Object.values(this.modelTypes);
  }

  /**
   * Get a specific enum by its enum
   *
   * @param name the final enum name that is generated
   * @returns enum type
   */
  public getEnum(name: string) {
    return this.enumTypes[name];
  }

  /**
   * Get list of all known enums, i.e. EnumType nodes from the EDMX model.
   * @returns list of enum types
   */
  public getEnums() {
    return Object.values(this.enumTypes);
  }

  /**
   * Get all special primitive data types, i.e. data types which are represented at strings,
   * but convey a specific meaning: DateString, GuidString, etc.
   *
   * @returns list of additional data types to import when working with the data model
   */
  public getPrimitiveTypeImports(): Array<string> {
    return [...this.primitiveTypeImports];
  }

  public getRootOperationType(name: string): OperationType {
    const rootOps = this.operationTypes[ROOT_OPERATION] || [];
    const rootOp = rootOps.find((op) => op.name === name);
    if (!rootOp) {
      throw Error(`Couldn't find root operation with name [${name}]`);
    }
    return rootOp;
  }

  public getOperationTypeByBinding(binding: string): Array<OperationType> {
    const operations = this.operationTypes[binding];
    return !operations ? [] : [...operations];
  }

  public getEntityContainer() {
    return this.container;
  }
}
