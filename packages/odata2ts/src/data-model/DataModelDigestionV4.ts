import { loadConverters, MappedConverterChains } from "@odata2ts/converter-runtime";
import { ODataTypesV4, ODataVersions } from "@odata2ts/odata-core";
import { DigesterFunction, DigestionOptions } from "../FactoryFunctionModel.js";
import { isOptimisticConcurrency } from "./CoreAnnotations.js";
import { NamespaceWithAlias, withNamespace } from "./DataModel.js";
import { Digester, TypeModel } from "./DataModelDigestion.js";
import { ODataVersion, OperationType, OperationTypes, PropertyModel } from "./DataTypeModel.js";
import { Annotatable, ComplexType, Property, Reference } from "./edmx/ODataEdmxModelBase.js";
import { ComplexTypeV4, EntityTypeV4, NavigationProperty, Operation, SchemaV4 } from "./edmx/ODataEdmxModelV4.js";
import { NamingHelper } from "./NamingHelper.js";

export const digest: DigesterFunction<SchemaV4> = async (schemas, options, namingHelper, references) => {
  const converters = await loadConverters(ODataVersions.V4, options.converters);

  const digester = new DigesterV4(schemas, options, namingHelper, converters, references);
  return digester.digest();
};

class DigesterV4 extends Digester<SchemaV4, EntityTypeV4, ComplexTypeV4> {
  constructor(
    schemas: Array<SchemaV4>,
    options: DigestionOptions,
    namingHelper: NamingHelper,
    converters?: MappedConverterChains,
    references?: Array<Reference>,
  ) {
    super(ODataVersion.V4, schemas, options, namingHelper, converters, references);
  }

  protected getNavigationProps(entityType: ComplexType | EntityTypeV4): Array<Property> {
    return (entityType as EntityTypeV4).NavigationProperty || [];
  }

  protected isContained(p: Property): boolean {
    return (p as NavigationProperty).$.ContainsTarget === "true";
  }

  protected getPartner(p: Property): string | undefined {
    return (p as NavigationProperty).$.Partner;
  }

  protected getReferentialConstraints(
    p: Property,
  ): ReadonlyArray<{ property: string; referencedProperty: string }> | undefined {
    const referentialConstraint = (p as NavigationProperty).ReferentialConstraint;
    return referentialConstraint?.length
      ? referentialConstraint.map((rc) => ({
          property: rc.$.Property,
          referencedProperty: rc.$.ReferencedProperty,
        }))
      : undefined;
  }

  protected digestOperations(schema: SchemaV4) {
    const nsWithAlias: NamespaceWithAlias = [schema.$.Namespace, schema.$.Alias];
    // functions & actions
    this.addOperations(nsWithAlias, schema.Function, OperationTypes.Function);
    this.addOperations(nsWithAlias, schema.Action, OperationTypes.Action);
  }

  /**
   * Whether this container child states that modifying it requires an ETag - unless the option switches
   * the evaluation off, in which case nothing does.
   */
  private isConcurrencyControlled(element: Annotatable): boolean {
    return !this.options.annotations?.disableOptimisticConcurrency && isOptimisticConcurrency(element.Annotation);
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
          singletonConfig?.mappedName || odataName,
        );
        const navPropBindings = singleton.NavigationPropertyBinding || [];
        const entityType = this.dataModel.getEntityType(singleton.$.Type);
        if (!entityType) {
          throw new Error(`Entity type "${singleton.$.Type}" not found!`);
        }

        const singletonConcurrency = this.isConcurrencyControlled(singleton);
        if (singletonConcurrency) {
          entityType.concurrencyControlled = true;
        }

        this.dataModel.addSingleton(fqName, {
          fqName,
          odataName,
          name,
          entityType,
          concurrencyControlled: singletonConcurrency,
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

        const entitySetConcurrency = this.isConcurrencyControlled(entitySet);
        if (entitySetConcurrency) {
          entityType.concurrencyControlled = true;
        }

        this.dataModel.addEntitySet(fqName, {
          fqName,
          odataName,
          name,
          entityType,
          concurrencyControlled: entitySetConcurrency,
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
        if (this.options.v4.bigNumberAsString) {
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
      // case ODataTypesV4.Duration:
      //   return {
      //     outputType: "string",
      //     qPath: "QDurationPath",
      //     qCollection: "QDurationCollection",
      //     qParam: "QDurationParam",
      //   };
      case ODataTypesV4.Binary:
        return {
          outputType: "string",
          qPath: "QBinaryPath",
          qCollection: "QBinaryCollection",
          qParam: "QBinaryParam",
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
      const isComposable = op.$.IsComposable === "true";
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
      /*
       * The binding type alone does not identify a bound operation: the spec allows two overloads that
       * differ only in cardinality - one bound to `Medium`, one to `Collection(Medium)`. Both carry the
       * same fully qualified name and the same binding type, so a name derived from the type alone
       * collides and the generated Q-objects end up with a duplicate identifier.
       *
       * Collection-bound operations therefore get a `Collection` infix, which is the same distinction
       * odata2ts already draws for services (`MediumService` vs. `MediumCollectionService`).
       */
      const bindingModel = bindingProp ? this.dataModel.getModel(bindingProp.fqType) : undefined;
      const bindingEntityName = bindingModel
        ? bindingProp!.isCollection
          ? `${bindingModel.name}Collection`
          : bindingModel.name
        : undefined;

      const opName = bindingEntityName
        ? this.nameValidator.addBoundOperationType(bindingEntityName, fqName, opConfig?.mappedName || odataName, type)
        : this.nameValidator.addUnboundOperationType(fqName, opConfig?.mappedName || odataName, type);

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
        type,
        parameters: params,
        returnType,
        composable: isComposable,
      };

      if (bindingProp) {
        this.dataModel.addBoundOperationType(namespace, bindingProp, opType);
      } else {
        this.dataModel.addUnboundOperationType(namespace, opType);
      }
    });
  }
}
