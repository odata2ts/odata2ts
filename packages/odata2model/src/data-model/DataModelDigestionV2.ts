import { RunOptions } from "../OptionModel";
import { ComplexTypeV3, EntityTypeV3, ODataTypesV3, SchemaV3 } from "./edmx/ODataEdmxModelV3";
import { OperationTypes, PropertyModel } from "./DataTypeModel";
import { DataModel } from "./DataModel";
import { Digester } from "./DataModelDigestion";
import { ComplexType, Property } from "./edmx/ODataEdmxModelBase";

/**
 * Takes an EDMX schema
 * @param schema
 * @param options
 */
export async function digest(schema: SchemaV3, options: RunOptions): Promise<DataModel> {
  const digester = new DigesterV3(schema, options);
  return digester.digest();
}

class DigesterV3 extends Digester<SchemaV3, EntityTypeV3, ComplexTypeV3> {
  constructor(schema: SchemaV3, options: RunOptions) {
    super(schema, options);
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

        const type = this.stripServicePrefix(end.$.Type);
        const isRequired = end.$.Multiplicity !== "*" && !end.$.Multiplicity.startsWith("0..");
        const isCollection = end.$.Multiplicity !== "1" && !end.$.Multiplicity.endsWith("..1");

        return {
          $: {
            Name: np.$.Name,
            Type: isCollection ? `Collection(${type})` : type,
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
        const parameters = funcImport.Parameter?.map(this.mapProperty) ?? [];

        // TODO: the spec allows for multiple ReturnType elements
        // https://docs.microsoft.com/en-us/openspecs/windows_protocols/mc-csdl/f510f36a-36bf-47f4-ac41-4a0ff921fbfa
        // totally unclear how the response object would look like
        const returnTypeDef =
          funcImport.$.ReturnType || (funcImport.ReturnType?.length ? funcImport.ReturnType[0].$.Type : undefined);
        const returnType: PropertyModel | undefined = returnTypeDef
          ? this.mapProperty({ $: { Name: "NO_NAME_BECAUSE_RETURN_TYPE", Type: returnTypeDef } })
          : undefined;

        this.dataModel.addFunction(name, {
          name,
          odataName: funcImport.$.Name,
          // TODO: does this really match V4 model?!
          entitySet: funcImport.$.EntitySet!,
          operation: {
            name,
            odataName: funcImport.$.Name,
            type: OperationTypes.Function,
            parameters,
            returnType,
          },
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

  protected mapODataType(type: string): string {
    switch (type) {
      case ODataTypesV3.Boolean:
        return "boolean";
      case ODataTypesV3.Int16:
      case ODataTypesV3.Int32:
        return "number";
      case ODataTypesV3.Byte:
      case ODataTypesV3.SByte:
      case ODataTypesV3.Int64:
      case ODataTypesV3.Decimal:
      case ODataTypesV3.Double:
      case ODataTypesV3.Single:
      case ODataTypesV3.String:
        return "string";
      case ODataTypesV3.DateTime:
        const dateType = "DateTimeString";
        this.dataModel.addPrimitiveTypeImport(dateType);
        return dateType;
      case ODataTypesV3.Time:
        const timeType = "TimeString";
        this.dataModel.addPrimitiveTypeImport(timeType);
        return timeType;
      case ODataTypesV3.DateTimeOffset:
        const dateTimeType = "DateTimeOffsetString";
        this.dataModel.addPrimitiveTypeImport(dateTimeType);
        return dateTimeType;
      case ODataTypesV3.Binary:
        const binaryType = "BinaryString";
        this.dataModel.addPrimitiveTypeImport(binaryType);
        return binaryType;
      case ODataTypesV3.Guid:
        const guidType = "GuidString";
        this.dataModel.addPrimitiveTypeImport(guidType);
        return guidType;
      default:
        return "string";
    }
  }
}
