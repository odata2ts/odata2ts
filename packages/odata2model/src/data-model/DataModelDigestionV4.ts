import { MappedConverterChains, loadConverters } from "@odata2ts/converter-runtime";
import { ODataTypesV4, ODataVersions } from "@odata2ts/odata-core";

import { DigesterFunction } from "../FactoryFunctionModel";
import { RunOptions } from "../OptionModel";
import { Digester, TypeModel } from "./DataModelDigestion";
import { ODataVersion, OperationType, OperationTypes, PropertyModel } from "./DataTypeModel";
import { ComplexType, Property } from "./edmx/ODataEdmxModelBase";
import { ComplexTypeV4, EntityTypeV4, Operation, SchemaV4 } from "./edmx/ODataEdmxModelV4";

/**
 * Takes an EDMX schema
 * @param schema
 * @param options
 */
export const digest: DigesterFunction<SchemaV4> = async (schema, options) => {
  const converters = await loadConverters(ODataVersions.V2, options.generation?.converters);

  const digester = new DigesterV4(schema, options, converters);
  return digester.digest();
};

class DigesterV4 extends Digester<SchemaV4, EntityTypeV4, ComplexTypeV4> {
  constructor(schema: SchemaV4, options: RunOptions, converters?: MappedConverterChains) {
    super(ODataVersion.V4, schema, options, converters);
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
          entityType: this.dataModel.getModel(this.getModelName(singleton.$.Type)),
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

  protected mapODataType(type: string): TypeModel {
    const converter = this.dataModel.getConverter(type);
    switch (type) {
      case ODataTypesV4.Boolean:
        return {
          outputType: converter?.to ?? "boolean",
          qPath: "QBooleanPath",
          qCollection: "QBooleanCollection",
          qParam: "QBooleanParam",
          converters: converter?.converters ?? [],
        };
      case ODataTypesV4.Byte:
      case ODataTypesV4.SByte:
      case ODataTypesV4.Int16:
      case ODataTypesV4.Int32:
      case ODataTypesV4.Int64:
      case ODataTypesV4.Single:
      case ODataTypesV4.Double:
      case ODataTypesV4.Decimal:
        return {
          outputType: converter?.to ?? "number",
          qPath: "QNumberPath",
          qCollection: "QNumberCollection",
          qParam: "QNumberParam",
          converters: converter?.converters ?? [],
        };
      case ODataTypesV4.String:
        return {
          outputType: converter?.to ?? "string",
          qPath: "QStringPath",
          qCollection: "QStringCollection",
          qParam: "QStringParam",
          converters: converter?.converters ?? [],
        };
      case ODataTypesV4.Date:
        return {
          outputType: converter?.to ?? "string",
          qPath: "QDatePath",
          qCollection: "QDateCollection",
          qParam: "QDateParam",
          converters: converter?.converters ?? [],
        };
      case ODataTypesV4.TimeOfDay:
        return {
          outputType: converter?.to ?? "string",
          qPath: "QTimeOfDayPath",
          qCollection: "QTimeOfDayCollection",
          qParam: "QTimeOfDayParam",
          converters: converter?.converters ?? [],
        };
      case ODataTypesV4.DateTimeOffset:
        return {
          outputType: converter?.to ?? "string",
          qPath: "QDateTimeOffsetPath",
          qCollection: "QDateTimeOffsetCollection",
          qParam: "QDateTimeOffsetParam",
          converters: converter?.converters ?? [],
        };
      case ODataTypesV4.Binary:
        return {
          outputType: converter?.to ?? "string",
          qPath: "QBinaryPath",
          qCollection: "QBinaryCollection",
          qParam: undefined,
          converters: converter?.converters ?? [],
        };
      case ODataTypesV4.Guid:
        return {
          outputType: converter?.to ?? "string",
          qPath: "QGuidPath",
          qCollection: "QGuidCollection",
          qParam: "QGuidParam",
          converters: converter?.converters ?? [],
        };
      default:
        return {
          outputType: converter?.to ?? "string",
          qPath: "QStringPath",
          qCollection: "QStringCollection",
          qParam: "QStringParam",
          converters: converter?.converters ?? [],
        };
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
        throw new Error(`IllegalState: Operation '${op.$.Name}' is bound, but has no parameters!`);
      }

      const bindingProp = isBound ? params.shift() : undefined;
      const binding = bindingProp
        ? bindingProp.isCollection
          ? `Collection(${bindingProp.type})`
          : bindingProp.type
        : DigesterV4.ROOT_OPERATION;
      this.dataModel.addOperationType(binding, {
        odataName: op.$.Name,
        name: this.getOperationName(op.$.Name),
        qName: this.getQOperationName(op.$.Name),
        paramsModelName: this.getOperationParamsModelName(op.$.Name),
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
      throw new Error(`Couldn't find root operation with name [${name}]`);
    }
    return rootOp;
  }
}
