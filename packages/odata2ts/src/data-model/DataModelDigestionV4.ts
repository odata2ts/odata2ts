import { MappedConverterChains, loadConverters } from "@odata2ts/converter-runtime";
import { ODataTypesV4, ODataVersions } from "@odata2ts/odata-core";

import { DigesterFunction, DigestionOptions } from "../FactoryFunctionModel";
import { Digester, TypeModel } from "./DataModelDigestion";
import { ODataVersion, OperationType, OperationTypes, PropertyModel } from "./DataTypeModel";
import { ComplexType, Property } from "./edmx/ODataEdmxModelBase";
import { ComplexTypeV4, EntityTypeV4, Operation, SchemaV4 } from "./edmx/ODataEdmxModelV4";
import { NamingHelper } from "./NamingHelper";

export const digest: DigesterFunction<SchemaV4> = async (schemas, options, namingHelper) => {
  const converters = await loadConverters(ODataVersions.V2, options.converters);

  const digester = new DigesterV4(schemas, options, namingHelper, converters);
  return digester.digest();
};

class DigesterV4 extends Digester<SchemaV4, EntityTypeV4, ComplexTypeV4> {
  constructor(
    schemas: Array<SchemaV4>,
    options: DigestionOptions,
    namingHelper: NamingHelper,
    converters?: MappedConverterChains
  ) {
    super(ODataVersion.V4, schemas, options, namingHelper, converters);
  }

  protected getNavigationProps(entityType: ComplexType | EntityTypeV4): Array<Property> {
    return (entityType as EntityTypeV4).NavigationProperty || [];
  }

  protected digestOperations(schema: SchemaV4) {
    // functions & actions
    this.addOperations(schema.$.Namespace, schema.Function, OperationTypes.Function);
    this.addOperations(schema.$.Namespace, schema.Action, OperationTypes.Action);
  }

  protected digestEntityContainer(schema: SchemaV4) {
    if (schema.EntityContainer && schema.EntityContainer.length) {
      const container = schema.EntityContainer[0];
      const ns = schema.$.Namespace;

      container.ActionImport?.forEach((actionImport) => {
        const name = this.namingHelper.getActionName(actionImport.$.Name);
        const fqName = `${ns}.${name}`;

        this.dataModel.addAction(fqName, {
          fqName,
          name,
          odataName: actionImport.$.Name,
          operation: actionImport.$.Action,
        });
      });

      container.FunctionImport?.forEach((funcImport) => {
        const name = this.namingHelper.getFunctionName(funcImport.$.Name);
        const fqName = `${ns}.${name}`;

        this.dataModel.addFunction(fqName, {
          fqName,
          name,
          odataName: funcImport.$.Name,
          operation: funcImport.$.Function,
          entitySet: funcImport.$.EntitySet,
        });
      });

      container.Singleton?.forEach((singleton) => {
        const name = singleton.$.Name;
        const fqName = `${ns}.${name}`;
        const navPropBindings = singleton.NavigationPropertyBinding || [];
        const entityType = this.dataModel.getModel(singleton.$.Type);
        if (!entityType) {
          throw new Error(`Entity type "${singleton.$.Type}" not found!`);
        }

        this.dataModel.addSingleton(fqName, {
          fqName,
          name,
          odataName: singleton.$.Name,
          entityType,
          navPropBinding: navPropBindings.map((binding) => ({
            path: this.namingHelper.stripServicePrefix(binding.$.Path),
            target: binding.$.Target,
          })),
        });
      });

      container.EntitySet?.forEach((entitySet) => {
        const name = entitySet.$.Name;
        const fqName = `${ns}.${name}`;
        const navPropBindings = entitySet.NavigationPropertyBinding || [];
        const entityType = this.dataModel.getModel(entitySet.$.EntityType);
        if (!entityType) {
          throw new Error(`Entity type "${entitySet.$.EntityType}" not found!`);
        }

        this.dataModel.addEntitySet(fqName, {
          fqName,
          name,
          odataName: entitySet.$.Name,
          entityType,
          navPropBinding: navPropBindings.map((binding) => ({
            path: this.namingHelper.stripServicePrefix(binding.$.Path),
            target: binding.$.Target,
          })),
        });
      });
    }
  }

  protected mapODataType(type: string): TypeModel {
    switch (type) {
      case ODataTypesV4.Boolean:
        return {
          outputType: "boolean",
          qPath: "QBooleanPath",
          qCollection: "QBooleanCollection",
          qParam: "QBooleanParam",
        };
      case ODataTypesV4.Int64:
      case ODataTypesV4.Decimal:
        if (this.options.v4BigNumberAsString) {
          return {
            outputType: "string",
            qPath: "QBigNumberPath",
            qCollection: "QBigNumberCollection",
            qParam: "QBigNumberParam",
          };
        }
      // yes, intentional fall through!
      case ODataTypesV4.Byte:
      case ODataTypesV4.SByte:
      case ODataTypesV4.Int16:
      case ODataTypesV4.Int32:
      case ODataTypesV4.Single:
      case ODataTypesV4.Double:
        return {
          outputType: "number",
          qPath: "QNumberPath",
          qCollection: "QNumberCollection",
          qParam: "QNumberParam",
        };
      case ODataTypesV4.String:
        return {
          outputType: "string",
          qPath: "QStringPath",
          qCollection: "QStringCollection",
          qParam: "QStringParam",
        };
      case ODataTypesV4.Date:
        return {
          outputType: "string",
          qPath: "QDatePath",
          qCollection: "QDateCollection",
          qParam: "QDateParam",
        };
      case ODataTypesV4.TimeOfDay:
        return {
          outputType: "string",
          qPath: "QTimeOfDayPath",
          qCollection: "QTimeOfDayCollection",
          qParam: "QTimeOfDayParam",
        };
      case ODataTypesV4.DateTimeOffset:
        return {
          outputType: "string",
          qPath: "QDateTimeOffsetPath",
          qCollection: "QDateTimeOffsetCollection",
          qParam: "QDateTimeOffsetParam",
        };
      case ODataTypesV4.Binary:
        return {
          outputType: "string",
          qPath: "QBinaryPath",
          qCollection: "QBinaryCollection",
          qParam: undefined,
        };
      case ODataTypesV4.Guid:
        return {
          outputType: "string",
          qPath: "QGuidPath",
          qCollection: "QGuidCollection",
          qParam: "QGuidParam",
        };
      default:
        return {
          outputType: "string",
          qPath: "QStringPath",
          qCollection: "QStringCollection",
          qParam: undefined,
        };
    }
  }

  private addOperations(namespace: string, operations: Array<Operation> | undefined, type: OperationTypes) {
    if (!operations || !operations.length) {
      return;
    }

    operations.forEach((op) => {
      const odataName = op.$.Name;
      const fqName = `${namespace}.${odataName}`;
      const params: Array<PropertyModel> = op.Parameter?.map((p) => this.mapProp(p)) ?? [];
      const returnType: PropertyModel | undefined = op.ReturnType?.map((rt) => {
        return this.mapProp({ ...rt, $: { Name: "NO_NAME_BECAUSE_RETURN_TYPE", ...rt.$ } });
      })[0];
      const isBound = op.$.IsBound === "true";

      if (isBound && !params.length) {
        throw new Error(`IllegalState: Operation '${odataName}' is bound, but has no parameters!`);
      }

      const bindingProp = isBound ? params.shift() : undefined;

      const name =
        type === OperationTypes.Function
          ? this.namingHelper.getFunctionName(odataName)
          : this.namingHelper.getActionName(odataName);
      const qName =
        type === OperationTypes.Function
          ? this.namingHelper.getQFunctionName(odataName, bindingProp)
          : this.namingHelper.getQActionName(odataName, bindingProp);
      const opType: OperationType = {
        fqName,
        odataName: isBound ? fqName : odataName,
        name,
        qName,
        paramsModelName: this.namingHelper.getOperationParamsModelName(odataName, bindingProp),
        type: type,
        parameters: params,
        returnType: returnType,
      };

      if (bindingProp) {
        this.dataModel.addBoundOperationType(namespace, bindingProp, opType);
      } else {
        this.dataModel.addUnboundOperationType(namespace, opType);
      }
    });
  }
}
