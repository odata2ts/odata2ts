import { RunOptions } from "../OptionModel";
import { ComplexType, Property } from "./edmx/ODataEdmxModelBase";
import { SchemaV4, Operation, ODataTypesV4, EntityTypeV4, ComplexTypeV4 } from "./edmx/ODataEdmxModelV4";
import { OperationType, OperationTypes, PropertyModel } from "./DataTypeModel";
import { Digester } from "./DataModelDigestion";
import { DataModel } from "./DataModel";

/**
 * Takes an EDMX schema
 * @param schema
 * @param options
 */
export async function digest(schema: SchemaV4, options: RunOptions): Promise<DataModel> {
  const digester = new DigesterV4(schema, options);
  return digester.digest();
}

class DigesterV4 extends Digester<SchemaV4, EntityTypeV4, ComplexTypeV4> {
  constructor(schema: SchemaV4, options: RunOptions) {
    super(schema, options);
  }

  protected getNavigationProps(entityType: ComplexType | EntityTypeV4): Array<Property> {
    return (entityType as EntityTypeV4).NavigationProperty || [];
  }

  protected digestEntityContainer() {
    // functions & actions
    this.addOperations(this.schema.Function, OperationTypes.Function);
    this.addOperations(this.schema.Action, OperationTypes.Action);

    if (this.schema.EntityContainer && this.schema.EntityContainer.length) {
      const container = this.schema.EntityContainer[0];

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
  }

  protected mapODataType(type: string): string {
    switch (type) {
      case ODataTypesV4.Boolean:
        return "boolean";
      case ODataTypesV4.Byte:
      case ODataTypesV4.SByte:
      case ODataTypesV4.Int16:
      case ODataTypesV4.Int32:
      case ODataTypesV4.Int64:
      case ODataTypesV4.Decimal:
      case ODataTypesV4.Double:
      case ODataTypesV4.Single:
        return "number";
      case ODataTypesV4.String:
        return "string";
      case ODataTypesV4.Date:
        const dateType = "DateString";
        this.dataModel.addPrimitiveTypeImport(dateType);
        return dateType;
      case ODataTypesV4.Time:
        const timeType = "TimeOfDayString";
        this.dataModel.addPrimitiveTypeImport(timeType);
        return timeType;
      case ODataTypesV4.DateTimeOffset:
        const dateTimeType = "DateTimeOffsetString";
        this.dataModel.addPrimitiveTypeImport(dateTimeType);
        return dateTimeType;
      case ODataTypesV4.Binary:
        const binaryType = "BinaryString";
        this.dataModel.addPrimitiveTypeImport(binaryType);
        return binaryType;
      case ODataTypesV4.Guid:
        const guidType = "GuidString";
        this.dataModel.addPrimitiveTypeImport(guidType);
        return guidType;
      default:
        return "string";
    }
  }

  private addOperations(operations: Array<Operation> | undefined, type: OperationTypes) {
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
      const binding = bindingProp ? bindingProp.type : DigesterV4.ROOT_OPERATION;
      this.dataModel.addOperationType(binding, {
        odataName: op.$.Name,
        name: this.getOperationName(op.$.Name),
        type: type,
        parameters: params,
        returnType: returnType,
      });
    });
  }

  private getRootOperationType(name: string): OperationType {
    const rootOps = this.dataModel.getOperationTypeByBinding(DigesterV4.ROOT_OPERATION);
    const rootOp = rootOps.find((op) => op.name === name);
    if (!rootOp) {
      throw Error(`Couldn't find root operation with name [${name}]`);
    }
    return rootOp;
  }
}
