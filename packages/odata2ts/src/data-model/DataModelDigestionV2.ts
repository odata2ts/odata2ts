import { MappedConverterChains, loadConverters } from "@odata2ts/converter-runtime";
import { ODataTypesV2, ODataVersions } from "@odata2ts/odata-core";

import { DigesterFunction, DigestionOptions } from "../FactoryFunctionModel";
import { Digester, TypeModel } from "./DataModelDigestion";
import { ODataVersion, OperationType, OperationTypes, PropertyModel } from "./DataTypeModel";
import { ComplexType, Property } from "./edmx/ODataEdmxModelBase";
import { AssociationEnd, ComplexTypeV3, EntityTypeV3, NavigationProperty, SchemaV3 } from "./edmx/ODataEdmxModelV3";
import { NamingHelper } from "./NamingHelper";

/**
 * Digests an EDMX schema to produce a DataModel.
 *
 * @param schema
 * @param options
 * @param namingHelper
 */
export const digest: DigesterFunction<SchemaV3> = async (schemas, options, namingHelper) => {
  const converters = await loadConverters(ODataVersions.V2, options.converters);

  const digester = new DigesterV3(schemas, options, namingHelper, converters);
  return digester.digest();
};

class DigesterV3 extends Digester<SchemaV3, EntityTypeV3, ComplexTypeV3> {
  constructor(
    schemas: Array<SchemaV3>,
    options: DigestionOptions,
    namingHelper: NamingHelper,
    converters: MappedConverterChains | undefined
  ) {
    super(ODataVersion.V2, schemas, options, namingHelper, converters);
  }

  private findAssociationEnd(np: NavigationProperty): AssociationEnd {
    for (let schema of this.schemas) {
      if (schema.Association) {
        const relationship = this.namingHelper.stripServicePrefix(np.$.Relationship);
        const association = schema.Association?.find((a) => a.$.Name === relationship);
        const result = association?.End.find((e) => e.$.Role === np.$.ToRole);
        if (result) {
          return result;
        }
      }
    }
    throw new Error(`Association end couldn't be determined for NavigationProperty [${np.$.Name}]`);
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

  // in V2 all we have & need is the FunctionImport: Function & Action elements are only known in V4.
  protected digestOperations(schema: SchemaV3) {}

  protected digestEntityContainer(schema: SchemaV3) {
    if (schema.EntityContainer && schema.EntityContainer.length) {
      const container = schema.EntityContainer[0];

      container.FunctionImport?.forEach((funcImport) => {
        const name = this.namingHelper.getFunctionName(funcImport.$.Name);
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

        const operation: OperationType = {
          name,
          odataName: funcImport.$.Name,
          paramsModelName: this.namingHelper.getOperationParamsModelName(funcImport.$.Name),
          qName: this.namingHelper.getQFunctionName(funcImport.$.Name),
          type: OperationTypes.Function,
          parameters,
          returnType,
          usePost,
        };
        this.dataModel.addOperationType("/", operation);

        this.dataModel.addFunction(name, {
          name,
          odataName: funcImport.$.Name,
          // TODO: does this really match V4 model?!
          entitySet: funcImport.$.EntitySet!,
          operation: operation,
        });
      });

      container.EntitySet?.forEach((entitySet) => {
        const name = entitySet.$.Name;

        this.dataModel.addEntitySet(name, {
          name,
          odataName: entitySet.$.Name,
          entityType: this.dataModel.getModel(this.namingHelper.getModelName(entitySet.$.EntityType)),
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
          qParam: undefined,
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
