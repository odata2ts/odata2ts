import { MappedConverterChains, loadConverters } from "@odata2ts/converter-runtime";
import { ODataTypesV2, ODataVersions } from "@odata2ts/odata-core";
import { pascalCase } from "pascal-case";

import { DigesterFunction } from "../FactoryFunctionModel";
import { RunOptions } from "../OptionModel";
import { Digester, TypeModel } from "./DataModelDigestion";
import { ODataVersion, OperationType, OperationTypes, PropertyModel } from "./DataTypeModel";
import { ComplexType, Property } from "./edmx/ODataEdmxModelBase";
import { ComplexTypeV3, EntityTypeV3, SchemaV3 } from "./edmx/ODataEdmxModelV3";

/**
 * Digests an EDMX schema to produce a DataModel.
 *
 * @param schema
 * @param options
 */
export const digest: DigesterFunction<SchemaV3> = async (schema, options) => {
  const converters = await loadConverters(ODataVersions.V2, options.generation?.converters);

  const digester = new DigesterV3(schema, options, converters);
  return digester.digest();
};

class DigesterV3 extends Digester<SchemaV3, EntityTypeV3, ComplexTypeV3> {
  constructor(schema: SchemaV3, options: RunOptions, converters: MappedConverterChains | undefined) {
    super(ODataVersion.V2, schema, options, converters);
  }

  protected getNavigationProps(entityType: ComplexType | EntityTypeV3): Array<Property> {
    // return (entityType as EntityTypeV3).NavigationProperty || [];
    const et = entityType as EntityTypeV3;
    if (et.NavigationProperty) {
      return et.NavigationProperty.map((np) => {
        const relationship = this.stripServicePrefix(np.$.Relationship);
        const association = this.schema.Association?.find((a) => a.$.Name === relationship);
        const end = association?.End.find((e) => e.$.Role === np.$.ToRole);
        if (!end) {
          throw new Error(`Association end couldn't be determined for NavigationProperty [${np.$.Name}]`);
        }

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

  protected digestEntityContainer() {
    if (this.schema.EntityContainer && this.schema.EntityContainer.length) {
      const container = this.schema.EntityContainer[0];

      container.FunctionImport?.forEach((funcImport) => {
        const name = this.getOperationName(funcImport.$.Name);
        const usePost = funcImport.$["m:HttpMethod"]?.toUpperCase() === "POST";
        const parameters = funcImport.Parameter?.map(this.mapProperty) ?? [];

        // TODO: the spec allows for multiple ReturnType elements
        // https://docs.microsoft.com/en-us/openspecs/windows_protocols/mc-csdl/f510f36a-36bf-47f4-ac41-4a0ff921fbfa
        // totally unclear how the response object would look like
        const returnTypeDef =
          funcImport.$.ReturnType || (funcImport.ReturnType?.length ? funcImport.ReturnType[0].$.Type : undefined);
        const returnType: PropertyModel | undefined = returnTypeDef
          ? this.mapProperty({ $: { Name: "NO_NAME_BECAUSE_RETURN_TYPE", Type: returnTypeDef } })
          : undefined;

        const operation: OperationType = {
          name,
          odataName: funcImport.$.Name,
          paramsModelName: pascalCase(funcImport.$.Name) + Digester.PARAMS_MODEL_SUFFIX,
          qName: this.getQOperationName(funcImport.$.Name),
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
        const name = this.getEntryPointName(entitySet.$.Name);

        this.dataModel.addEntitySet(name, {
          name,
          odataName: entitySet.$.Name,
          entityType: this.dataModel.getModel(this.getModelName(entitySet.$.EntityType)),
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
          qPath: "QNumberPath",
          qCollection: "QNumberCollection",
          qParam: "QNumberParam",
        };
      case ODataTypesV2.Byte:
      case ODataTypesV2.SByte:
      case ODataTypesV2.Int64:
      case ODataTypesV2.Single:
      case ODataTypesV2.Double:
      case ODataTypesV2.Decimal:
        return {
          outputType: "string",
          qPath: "QNumberPath",
          qCollection: "QNumberCollection",
          qParam: "QNumberParam",
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
