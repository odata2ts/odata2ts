import { RunOptions } from "../OptionModel";
import { ComplexTypeV3, EntityTypeV3, ODataTypesV3, SchemaV3 } from "./edmx/ODataEdmxModelV3";
import { ODataVersion, OperationType, OperationTypes, PropertyModel } from "./DataTypeModel";
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
    super(ODataVersion.V2, schema, options);
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

  protected mapODataType(type: string): [string, string, string] {
    switch (type) {
      case ODataTypesV3.Boolean:
        return ["boolean", "QBooleanPath", "QBooleanCollection"];
      case ODataTypesV3.Int16:
      case ODataTypesV3.Int32:
        return ["number", "QNumberPath", "QNumberCollection"];
      case ODataTypesV3.Byte:
      case ODataTypesV3.SByte:
      case ODataTypesV3.Int64:
      case ODataTypesV3.Single:
      case ODataTypesV3.Double:
      case ODataTypesV3.Decimal:
        return ["string", "QNumberPath", "QNumberCollection"];
      case ODataTypesV3.String:
        return ["string", "QStringV2Path", "QStringV2Collection"];
      case ODataTypesV3.DateTime:
        return ["string", "QDateTimeV2Path", "QDateTimeV2Collection"];
      case ODataTypesV3.Time:
        return ["string", "QTimeV2Path", "QTimeV2Collection"];
      case ODataTypesV3.DateTimeOffset:
        return ["string", "QDateTimeOffsetV2Path", "QDateTimeOffsetV2Collection"];
      case ODataTypesV3.Binary:
        return ["string", "QBinaryPath", "QBinaryCollection"];
      case ODataTypesV3.Guid:
        return ["string", "QGuidV2Path", "QGuidV2Collection"];
      default:
        return ["string", "QStringV2Path", "QStringV2Collection"];
    }
  }
}
