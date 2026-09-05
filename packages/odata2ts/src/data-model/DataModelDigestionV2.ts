import { loadConverters, MappedConverterChains } from "@odata2ts/converter-runtime";
import { ODataTypesV2, ODataVersions } from "@odata2ts/odata-core";
import { DigesterFunction, DigestionOptions } from "../FactoryFunctionModel.js";
import { isOptimisticConcurrency } from "./CoreAnnotations.js";
import { withNamespace } from "./DataModel.js";
import { Digester, TypeModel } from "./DataModelDigestion.js";
import { NavPropBindingType, ODataVersion, OperationTypes, PropertyModel } from "./DataTypeModel.js";
import { ComplexType, Property, Reference } from "./edmx/ODataEdmxModelBase.js";
import {
  Association,
  AssociationEnd,
  ComplexTypeV3,
  EntityContainerV3,
  EntityTypeV3,
  NavigationProperty,
  SchemaV3,
} from "./edmx/ODataEdmxModelV3.js";
import { NamingHelper } from "./NamingHelper.js";

/**
 * Digests an EDMX schema to produce a DataModel.
 *
 * @param schemas
 * @param options
 * @param namingHelper
 */
export const digest: DigesterFunction<SchemaV3> = async (schemas, options, namingHelper, references) => {
  const converters = await loadConverters(ODataVersions.V2, options.converters);

  const digester = new DigesterV3(schemas, options, namingHelper, converters, references);
  return digester.digest();
};

class DigesterV3 extends Digester<SchemaV3, EntityTypeV3, ComplexTypeV3> {
  constructor(
    schemas: Array<SchemaV3>,
    options: DigestionOptions,
    namingHelper: NamingHelper,
    converters: MappedConverterChains | undefined,
    references: Array<Reference> | undefined,
  ) {
    super(ODataVersion.V2, schemas, options, namingHelper, converters, references);
  }

  /**
   * The `<Association>` a navigation property points at, found by its (unqualified) relationship name.
   * Shared by {@link findAssociationEnd}, which additionally needs the specific end, and by
   * {@link getPartner}/{@link getReferentialConstraints}, which need the association as a whole - the
   * partner lookup for the other end's type, the constraint because it is stated once per association
   * rather than per end.
   */
  private findAssociation(np: NavigationProperty): Association {
    const relationship = this.namingHelper.stripServicePrefix(np.$.Relationship);
    for (let schema of this.schemas) {
      const association = schema.Association?.find((a) => a.$.Name === relationship);
      if (association) {
        return association;
      }
    }
    throw new Error(`Association end couldn't be determined for NavigationProperty [${np.$.Name}]`);
  }

  private findAssociationEnd(np: NavigationProperty): AssociationEnd {
    const end = this.findAssociation(np).End.find((e) => e.$.Role === np.$.ToRole);
    if (!end) {
      throw new Error(`Association end couldn't be determined for NavigationProperty [${np.$.Name}]`);
    }
    return end;
  }

  private findEdmxEntityType(fqTypeName: string): EntityTypeV3 | undefined {
    const name = this.namingHelper.stripServicePrefix(fqTypeName);
    for (let schema of this.schemas) {
      const found = schema.EntityType?.find((et) => et.$.Name === name);
      if (found) {
        return found;
      }
    }
    return undefined;
  }

  /**
   * The raw `<NavigationProperty>` a mapped {@link Property} was built from, resolved by declaring entity
   * type and name. {@link getNavigationProps} reshapes navigation properties into the same `{ $: { Name,
   * Type, Nullable } }` shape as a plain `<Property>`, so `Relationship`/`FromRole`/`ToRole` - everything
   * {@link getPartner} and {@link getReferentialConstraints} need - are gone by the time `mapProp` sees it.
   * Looking the original element back up by owner and name is what gets them back.
   */
  private findNavProp(fqOwnerName: string, name: string): NavigationProperty | undefined {
    return this.findEdmxEntityType(fqOwnerName)?.NavigationProperty?.find((np) => np.$.Name === name);
  }

  /**
   * The inverse navigation property, resolved from the association's other end: the entity type declared
   * there, and on it the navigation property realizing the same association with `FromRole`/`ToRole`
   * swapped. Undefined where no such navigation property exists - an association end nothing navigates
   * back from is legal.
   */
  protected getPartner(p: Property, fqOwnerName?: string): string | undefined {
    const np = fqOwnerName ? this.findNavProp(fqOwnerName, p.$.Name) : undefined;
    if (!np) {
      return undefined;
    }

    const association = this.findAssociation(np);
    const targetEnd = association.End.find((e) => e.$.Role === np.$.ToRole);
    const targetType = targetEnd && this.findEdmxEntityType(targetEnd.$.Type);
    const relationship = this.namingHelper.stripServicePrefix(np.$.Relationship);

    const partnerNavProp = targetType?.NavigationProperty?.find(
      (candidate) =>
        this.namingHelper.stripServicePrefix(candidate.$.Relationship) === relationship &&
        candidate.$.FromRole === np.$.ToRole &&
        candidate.$.ToRole === np.$.FromRole,
    );
    return partnerNavProp?.$.Name;
  }

  /**
   * The foreign key stated on the `<Association>`'s `<ReferentialConstraint>`, resolved to the same shape
   * V4 states directly on its navigation property. V2 states the constraint once, naming its two sides by
   * role, so it applies only to the navigation property that points *at* the principal - that one's own
   * declaring type is the dependent side, which is where the foreign key actually lives. The navigation
   * property pointing at the dependent side gets nothing, mirroring V4 exactly and keeping the two versions
   * indistinguishable from here on.
   */
  protected getReferentialConstraints(
    p: Property,
    fqOwnerName?: string,
  ): ReadonlyArray<{ property: string; referencedProperty: string }> | undefined {
    const np = fqOwnerName ? this.findNavProp(fqOwnerName, p.$.Name) : undefined;
    if (!np) {
      return undefined;
    }

    const constraint = this.findAssociation(np).ReferentialConstraint?.[0];
    const principal = constraint?.Principal[0];
    const dependent = constraint?.Dependent[0];
    if (!principal || !dependent || np.$.ToRole !== principal.$.Role) {
      return undefined;
    }

    // a composite key gone out of sync between the two sides would produce a half-derived constraint that
    // is worse than none - so this is skipped rather than repaired by guesswork
    if (dependent.PropertyRef.length !== principal.PropertyRef.length) {
      return undefined;
    }

    return dependent.PropertyRef.map((ref, index) => ({
      property: ref.$.Name,
      referencedProperty: principal.PropertyRef[index].$.Name,
    }));
  }

  /**
   * The V2 counterpart of V4's NavigationPropertyBinding: an AssociationSet states by which EntitySets the
   * two ends of an association are realized, which is exactly the information needed to know where a
   * navigation property points to.
   *
   * The same association can be realized by more than one AssociationSet, hence the matching one is the one
   * whose end for the source role is this very entity set.
   */
  private getNavPropBindings(
    container: EntityContainerV3,
    entitySetName: string,
    fqEntityTypeName: string,
  ): Array<NavPropBindingType> {
    const navProps = this.findEdmxEntityType(fqEntityTypeName)?.NavigationProperty;
    if (!navProps?.length || !container.AssociationSet?.length) {
      return [];
    }

    return navProps.reduce<Array<NavPropBindingType>>((collector, np) => {
      const relationship = this.namingHelper.stripServicePrefix(np.$.Relationship);
      const associationSet = container.AssociationSet!.find(
        (as) =>
          this.namingHelper.stripServicePrefix(as.$.Association) === relationship &&
          as.End.some((end) => end.$.Role === np.$.FromRole && end.$.EntitySet === entitySetName),
      );
      const target = associationSet?.End.find((end) => end.$.Role === np.$.ToRole)?.$.EntitySet;

      if (target) {
        collector.push({ path: np.$.Name, target });
      }
      return collector;
    }, []);
  }

  protected getNavigationProps(entityType: ComplexType | EntityTypeV3): Array<Property> {
    // return (entityType as EntityTypeV3).NavigationProperty || [];
    const et = entityType as EntityTypeV3;
    if (et.NavigationProperty) {
      return et.NavigationProperty.map((np) => {
        const end = this.findAssociationEnd(np);
        const isRequired = end.$.Multiplicity !== "*" && !end.$.Multiplicity.startsWith("0..");
        const isCollection = end.$.Multiplicity !== "1" && !end.$.Multiplicity.endsWith("..1");

        return {
          $: {
            Name: np.$.Name,
            Type: isCollection ? `Collection(${end.$.Type})` : end.$.Type,
            Nullable: isRequired ? "false" : "true",
          },
        };
      });
    }

    return [];
  }

  protected isMediaEntity(entityType: EntityTypeV3): boolean {
    return entityType.$["m:HasStream"] === "true";
  }

  // in V2 all we have & need is the FunctionImport: Function & Action elements are only known in V4.
  protected digestOperations(schema: SchemaV3) {}

  protected digestEntityContainer(schema: SchemaV3) {
    if (schema.EntityContainer && schema.EntityContainer.length) {
      const container = schema.EntityContainer[0];
      const ecName = container.$.Name;

      container.FunctionImport?.forEach((funcImport) => {
        const odataName = funcImport.$.Name;
        const fqName = withNamespace(ecName, odataName);
        const opConfig = this.serviceConfigHelper.findOperationImportConfig(ecName, odataName);
        const opName = this.nameValidator.addOperationImportType(fqName, opConfig?.mappedName || odataName);
        const name = this.namingHelper.getFunctionName(opName);
        const usePost = funcImport.$["m:HttpMethod"]?.toUpperCase() === "POST";
        const parameters = funcImport.Parameter?.map((p) => this.mapProp(p)) ?? [];

        // TODO: the spec allows for multiple ReturnType elements
        // https://docs.microsoft.com/en-us/openspecs/windows_protocols/mc-csdl/f510f36a-36bf-47f4-ac41-4a0ff921fbfa
        // totally unclear how the response object would look like
        const returnTypeDef =
          funcImport.$.ReturnType || (funcImport.ReturnType?.length ? funcImport.ReturnType[0].$.Type : undefined);
        const returnType: PropertyModel | undefined = returnTypeDef
          ? this.mapProp({ $: { Name: "NO_NAME_BECAUSE_RETURN_TYPE", Type: returnTypeDef } })
          : undefined;

        // V2 only knows the FunctionImport element
        // we generate the data structure for the function here
        this.dataModel.addUnboundOperationType(ecName, {
          fqName,
          odataName,
          name,
          paramsModelName: this.namingHelper.getOperationParamsModelName(opName),
          qName: this.namingHelper.getQFunctionName(opName),
          type: OperationTypes.Function,
          parameters,
          returnType,
          usePost,
        });

        this.dataModel.addFunction(fqName, {
          fqName,
          odataName,
          name,
          entitySet: funcImport.$.EntitySet!,
          operation: fqName,
        });
      });

      container.EntitySet?.forEach((entitySet) => {
        const odataName = entitySet.$.Name;
        const fqName = withNamespace(ecName, odataName);
        const config = this.serviceConfigHelper.findEntitySetConfig(ecName, odataName);
        const name = this.nameValidator.addEntitySet(fqName, config?.mappedName || odataName);
        const entityType = this.dataModel.getEntityType(entitySet.$.EntityType);
        if (!entityType) {
          throw new Error(`Entity type "${entitySet.$.EntityType}" not found!`);
        }

        // V2 states the concurrency token as a schema facet rather than as an annotation; the
        // V2AnnotationResolver has normalized it into `Core.OptimisticConcurrency` by now, so this reads
        // exactly like its V4 counterpart
        const concurrencyControlled =
          !this.options.annotations?.disableOptimisticConcurrency && isOptimisticConcurrency(entitySet.Annotation);
        if (concurrencyControlled) {
          entityType.concurrencyControlled = true;
        }

        this.dataModel.addEntitySet(fqName, {
          fqName,
          odataName,
          name,
          entityType,
          concurrencyControlled,
          navPropBinding: this.getNavPropBindings(container, odataName, entitySet.$.EntityType),
        });
      });
    }
  }

  protected mapODataType(type: string): TypeModel {
    switch (type) {
      case ODataTypesV2.Boolean:
        return {
          outputType: "boolean",
          qPath: "QBooleanPath",
          qCollection: "QBooleanCollection",
          qParam: "QBooleanParam",
        };
      case ODataTypesV2.Int16:
      case ODataTypesV2.Int32:
        return {
          outputType: "number",
          qPath: "QNumberV2Path",
          qCollection: "QNumberV2Collection",
          qParam: "QNumberParam",
        };
      case ODataTypesV2.Byte:
      case ODataTypesV2.SByte:
        return {
          outputType: "string",
          qPath: "QStringNumberV2Path",
          qCollection: "QStringNumberV2Collection",
          qParam: "QStringNumberV2Param",
        };
      case ODataTypesV2.Int64:
        return {
          outputType: "string",
          qPath: "QStringNumberV2Path",
          qCollection: "QStringNumberV2Collection",
          qParam: "QInt64V2Param",
        };
      case ODataTypesV2.Single:
        return {
          outputType: "string",
          qPath: "QStringNumberV2Path",
          qCollection: "QStringNumberV2Collection",
          qParam: "QSingleV2Param",
        };
      case ODataTypesV2.Double:
        return {
          outputType: "string",
          qPath: "QStringNumberV2Path",
          qCollection: "QStringNumberV2Collection",
          qParam: "QDoubleV2Param",
        };
      case ODataTypesV2.Decimal:
        return {
          outputType: "string",
          qPath: "QStringNumberV2Path",
          qCollection: "QStringNumberV2Collection",
          qParam: "QDecimalV2Param",
        };
      case ODataTypesV2.String:
        return {
          outputType: "string",
          qPath: "QStringV2Path",
          qCollection: "QStringV2Collection",
          qParam: "QStringParam",
        };
      case ODataTypesV2.DateTime:
        return {
          outputType: "string",
          qPath: "QDateTimeV2Path",
          qCollection: "QDateTimeV2Collection",
          qParam: "QDateTimeV2Param",
        };
      case ODataTypesV2.Time:
        return {
          outputType: "string",
          qPath: "QTimeV2Path",
          qCollection: "QTimeV2Collection",
          qParam: "QTimeV2Param",
        };
      case ODataTypesV2.DateTimeOffset:
        return {
          outputType: "string",
          qPath: "QDateTimeOffsetV2Path",
          qCollection: "QDateTimeOffsetV2Collection",
          qParam: "QDateTimeOffsetV2Param",
        };
      case ODataTypesV2.Binary:
        return {
          outputType: "string",
          qPath: "QBinaryPath",
          qCollection: "QBinaryCollection",
          qParam: "QBinaryV2Param",
        };
      case ODataTypesV2.Guid:
        return {
          outputType: "string",
          qPath: "QGuidV2Path",
          qCollection: "QGuidV2Collection",
          qParam: "QGuidV2Param",
        };
      default:
        return {
          outputType: "string",
          qPath: "QStringV2Path",
          qCollection: "QStringV2Collection",
          qParam: undefined,
        };
    }
  }
}
