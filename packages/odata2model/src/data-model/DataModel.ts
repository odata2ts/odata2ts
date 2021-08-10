import { upperCaseFirst } from "upper-case-first";
import { firstCharLowerCase } from "xml2js/lib/processors";
import { RunOptions } from "../app";
import { Property, NavigationProperty, Schema, OdataTypes } from "../odata/ODataEdmxModel";
import { ModelType, EnumType, DataTypes, PropertyModel } from "./DataTypeModel";

const EDM_PREFIX = "Edm.";

/**
 * EntityType, ComplexType, EnumType, PrimitiveType
 */
// export interface DataModel {}

export class DataModel {
  private serviceName: string;
  private servicePrefix: string;

  // combines entity & complex types
  private modelTypes: { [name: string]: ModelType } = {};
  private enumTypes: { [name: string]: EnumType } = {};
  private primitiveTypeImports: Set<string> = new Set();

  constructor(schema: Schema, private options: RunOptions) {
    this.serviceName = schema.$.Namespace;
    this.servicePrefix = this.serviceName + ".";

    this.digestSchema(schema);
  }

  private getModelName(name: string) {
    return `${this.options.modelPrefix}${upperCaseFirst(name)}${this.options.modelSuffix}`;
  }

  private getEnumName(name: string) {
    return `${upperCaseFirst(name)}`;
  }

  private stripServicePrefix(token: string) {
    return token.replace(new RegExp(this.servicePrefix), "");
  }

  private digestSchema(schema: Schema) {
    // enums
    schema.EnumType?.forEach((et) => {
      const name = et.$.Name;
      this.enumTypes[name] = {
        odataName: name,
        name: this.getEnumName(name),
        members: et.Member.map((m) => m.$.Name),
      };
    });

    // entity types & complex types
    const models = [...(schema.EntityType ?? []), ...(schema.ComplexType ?? [])];
    models.forEach((model) => {
      const name = this.getModelName(model.$.Name);
      const bType = model.$.BaseType;
      const props = [...(model.Property ?? []), ...(model.NavigationProperty ?? [])];

      // support for base types, i.e. extends clause of interfaces
      const baseTypes = [];
      if (bType) {
        baseTypes.push(this.getModelName(this.stripServicePrefix(bType)));
      }

      this.modelTypes[name] = {
        odataName: model.$.Name,
        name: name,
        baseClasses: baseTypes,
        props: props.map(this.mapProperty),
      };
    });
  }

  private mapProperty = (p: Property | NavigationProperty): PropertyModel => {
    const isCollection = !!p.$.Type.match(/^Collection\(/);
    const dataType = p.$.Type.replace(/^Collection\(([^\)]+)\)/, "$1");

    const result: Partial<PropertyModel> = {
      odataName: p.$.Name,
      name: firstCharLowerCase(p.$.Name),
      odataType: p.$.Type,
      required: p.$.Nullable === "false",
      isCollection: isCollection,
    };

    // domain object known from service, e.g. EntitySet, EnumType, ...
    if (dataType.startsWith(this.servicePrefix)) {
      const newType = this.stripServicePrefix(dataType);
      const enumType = this.enumTypes[newType];
      // special handling for enums
      if (enumType) {
        result.type = enumType.name;
        result.dataType = DataTypes.EnumType;
      } else {
        result.type = this.getModelName(newType);
        result.dataType = DataTypes.ModelType;
      }
    }
    // OData built-in data types
    else if (dataType.startsWith(EDM_PREFIX)) {
      result.type = this.mapODataType(dataType);
      result.dataType = DataTypes.PrimitiveType;
    } else {
      throw Error(`Unknown type: Not 'Collection(...)', not '${this.servicePrefix}*', not OData type 'Edm.*'`);
    }

    return result as PropertyModel;
  };

  private mapODataType(type: string): string {
    switch (type) {
      case OdataTypes.Boolean:
        return "boolean";
      case OdataTypes.Byte:
      case OdataTypes.SByte:
      case OdataTypes.Int16:
      case OdataTypes.Int32:
      case OdataTypes.Int64:
      case OdataTypes.Decimal:
      case OdataTypes.Double:
      case OdataTypes.Single:
        return "number";
      case OdataTypes.String:
        return "string";
      case OdataTypes.Date:
        const dateType = "DateString";
        this.primitiveTypeImports.add(dateType);
        return dateType;
      case OdataTypes.Time:
        const timeType = "TimeOfDayString";
        this.primitiveTypeImports.add(timeType);
        return timeType;
      case OdataTypes.DateTimeOffset:
        const dateTimeType = "DateTimeOffsetString";
        this.primitiveTypeImports.add(dateTimeType);
        return dateTimeType;
      case OdataTypes.Binary:
        const binaryType = "BinaryString";
        this.primitiveTypeImports.add(binaryType);
        return binaryType;
      case OdataTypes.Guid:
        const guidType = "GuidString";
        this.primitiveTypeImports.add(guidType);
        return guidType;
      default:
        return "string";
    }
  }

  public getServiceName() {
    return this.serviceName;
  }

  public getServicePrefix() {
    return this.servicePrefix;
  }

  public getModel(modelName: string) {
    return this.modelTypes[modelName];
  }

  public getModels() {
    return Object.values(this.modelTypes);
  }

  public getEnum(name: string) {
    return this.enumTypes[name];
  }

  public getEnums() {
    return Object.values(this.enumTypes);
  }

  public getPrimitiveTypeImports(): Array<string> {
    return [...this.primitiveTypeImports];
  }
}
