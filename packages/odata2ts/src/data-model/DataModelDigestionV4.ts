import { MappedConverterChains, loadConverters } from "@odata2ts/converter-runtime";
import { ODataTypesV4, ODataVersions } from "@odata2ts/odata-core";

import { DigesterFunction, DigestionOptions } from "../FactoryFunctionModel";
import { NamespaceWithAlias, withNamespace } from "./DataModel";
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
    // .map(p => {
    //   const entityConfig = this.serviceConfigHelper.findEntityTypeConfig()
    //   return {
    //     $: {
    //       ...p.$,
    //       Type:
    //     }
    //   }
    // })
  }

  protected digestOperations(schema: SchemaV4) {
    const nsWithAlias: NamespaceWithAlias = [schema.$.Namespace, schema.$.Alias];
    // functions & actions
    this.addOperations(nsWithAlias, schema.Function, OperationTypes.Function);
    this.addOperations(nsWithAlias, schema.Action, OperationTypes.Action);
  }

  protected digestEntityContainer(schema: SchemaV4) {
    if (schema.EntityContainer && schema.EntityContainer.length) {
      const container = schema.EntityContainer[0];

      const ecName = container.$.Name;

      container.ActionImport?.forEach((actionImport) => {
        const odataName = actionImport.$.Name;
        const fqName = withNamespace(ecName, odataName);
        const opConfig = this.serviceConfigHelper.findOperationImportConfig(ecName, odataName);
        const opName = this.nameValidator.addOperationImportType(fqName, opConfig?.mappedName || odataName);

        this.dataModel.addAction(fqName, {
          fqName,
          name: this.namingHelper.getActionName(opName),
          odataName: actionImport.$.Name,
          operation: actionImport.$.Action,
        });
      });

      container.FunctionImport?.forEach((funcImport) => {
        const odataName = funcImport.$.Name;
        const fqName = withNamespace(ecName, odataName);
        const opConfig = this.serviceConfigHelper.findOperationImportConfig(ecName, odataName);
        const opName = this.nameValidator.addOperationImportType(fqName, opConfig?.mappedName || odataName);

        this.dataModel.addFunction(fqName, {
          fqName,
          odataName,
          name: this.namingHelper.getFunctionName(opName),
          operation: funcImport.$.Function,
          entitySet: funcImport.$.EntitySet,
        });
      });

      container.Singleton?.forEach((singleton) => {
        const odataName = singleton.$.Name;
        const fqName = withNamespace(ecName, odataName);
        const singletonConfig = this.serviceConfigHelper.findOperationImportConfig(ecName, odataName);
        const name = this.nameValidator.addSingleton(
          withNamespace(fqName, odataName),
          singletonConfig?.mappedName || odataName
        );
        const navPropBindings = singleton.NavigationPropertyBinding || [];
        const entityType = this.dataModel.getEntityType(singleton.$.Type);
        if (!entityType) {
          throw new Error(`Entity type "${singleton.$.Type}" not found!`);
        }

        this.dataModel.addSingleton(fqName, {
          fqName,
          odataName,
          name,
          entityType,
          navPropBinding: navPropBindings.map((binding) => ({
            path: this.namingHelper.stripServicePrefix(binding.$.Path),
            target: binding.$.Target,
          })),
        });
      });

      container.EntitySet?.forEach((entitySet) => {
        const odataName = entitySet.$.Name;
        const fqName = withNamespace(ecName, odataName);
        const config = this.serviceConfigHelper.findOperationImportConfig(ecName, odataName);
        const name = this.nameValidator.addEntitySet(fqName, config?.mappedName || odataName);
        const navPropBindings = entitySet.NavigationPropertyBinding || [];
        const entityType = this.dataModel.getEntityType(entitySet.$.EntityType);
        if (!entityType) {
          throw new Error(`Entity type "${entitySet.$.EntityType}" not found!`);
        }

        this.dataModel.addEntitySet(fqName, {
          fqName,
          odataName,
          name,
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

  private addOperations(ns: NamespaceWithAlias, operations: Array<Operation> | undefined, type: OperationTypes) {
    const [namespace] = ns;
    if (!operations || !operations.length) {
      return;
    }

    operations.forEach((op) => {
      const odataName = op.$.Name;
      const isBound = op.$.IsBound === "true";
      const fqName = withNamespace(namespace, odataName);
      const opConfig = this.serviceConfigHelper.findOperationTypeConfig(ns, odataName);
      const params: Array<PropertyModel> = op.Parameter?.map((p) => this.mapProp(p)) ?? [];
      const returnType: PropertyModel | undefined = op.ReturnType?.map((rt) => {
        return this.mapProp({ ...rt, $: { Name: "NO_NAME_BECAUSE_RETURN_TYPE", ...rt.$ } });
      })[0];

      if (isBound && !params.length) {
        throw new Error(`IllegalState: Operation '${odataName}' is bound, but has no parameters!`);
      }

      const bindingProp = isBound ? params.shift() : undefined;
      const bindingEntityName = bindingProp ? this.dataModel.getModel(bindingProp!.fqType)?.name : undefined;

      const opName = bindingEntityName
        ? this.nameValidator.addBoundOperationType(bindingEntityName, fqName, opConfig?.mappedName || odataName)
        : this.nameValidator.addUnboundOperationType(fqName, opConfig?.mappedName || odataName);

      const name =
        type === OperationTypes.Function
          ? this.namingHelper.getFunctionName(opName)
          : this.namingHelper.getActionName(opName);
      const qName =
        type === OperationTypes.Function
          ? this.namingHelper.getQFunctionName(opName, bindingEntityName)
          : this.namingHelper.getQActionName(opName, bindingEntityName);
      const opType: OperationType = {
        fqName,
        odataName: isBound ? fqName : odataName,
        name,
        qName,
        paramsModelName: this.namingHelper.getOperationParamsModelName(opName, bindingEntityName),
        folderPath: this.namingHelper.getFolderPath(namespace[0], name),
        type,
        parameters: params,
        returnType,
      };

      if (bindingProp) {
        this.dataModel.addBoundOperationType(namespace, bindingProp, opType);
      } else {
        this.dataModel.addUnboundOperationType(namespace, opType);
      }
    });
  }
}
