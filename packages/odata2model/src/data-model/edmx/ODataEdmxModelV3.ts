import {
  ODataEdmxModelBase,
  EntityContainer,
  Schema,
  Property,
  ReturnType,
  EntityType,
  ComplexType,
} from "./ODataEdmxModelBase";

export interface ODataEdmxModelV3 extends ODataEdmxModelBase<SchemaV3> {}

export interface SchemaV3 extends Schema<EntityTypeV3, ComplexTypeV3> {
  EntityContainer?: Array<EntityContainerV3>;
  Association?: Array<Association>;
}

export interface EntityTypeV3 extends EntityType {
  NavigationProperty?: Array<NavigationProperty>;
}

export interface ComplexTypeV3 extends ComplexType {}

export interface NavigationProperty {
  $: {
    Name: string;
    Relationship: string;
    FromRole: string;
    ToRole: string;
  };
}

export interface EntityContainerV3 extends EntityContainer {
  AssociationSet?: Array<AssociationSet>;
  FunctionImport?: Array<FunctionImport>;
}

export interface AssociationSet {
  $: {
    Name: string;
    Association: string;
  };
  End: Array<AssociationSetEnd>;
}

export interface AssociationSetEnd {
  $: {
    Role: string;
    EntitySet: string;
  };
}

export interface FunctionImport {
  $: {
    Name: string;
    EntitySet?: string;
    ReturnType?: string;
    "m:HttpMethod"?: "POST" | "GET";
  };
  ReturnType?: Array<ReturnType>;
  Parameter?: Array<Parameter>;
}

export interface Parameter extends Property {
  Mode?: "In" | "Out" | "InOut";
}

export interface Association {
  $: {
    Name: string;
  };
  End: Array<AssociationEnd>;
}

export interface AssociationEnd {
  $: {
    Type: string;
    Multiplicity: string;
    Role?: string;
  };
}

export const enum ODataTypesV3 {
  Binary = "Edm.Binary",
  Boolean = "Edm.Boolean",
  String = "Edm.String",
  Byte = "Edm.Byte",
  SByte = "Edm.SByte",
  Int16 = "Edm.Int16",
  Int32 = "Edm.Int32",
  Int64 = "Edm.Int64",
  Decimal = "Edm.Decimal",
  Double = "Edm.Double",
  Single = "Edm.Single",
  Guid = "Edm.Guid",
  DateTime = "Edm.DateTime",
  Time = "Edm.Time",
  DateTimeOffset = "Edm.DateTimeOffset",
  // TODO
  // Stream = "Edm.Stream",
  // Geography = "Geography",
  // GeographyPoint = "GeographyPoint",
  // GeographyLineString = "GeographyLineString",
  // GeographyPolygon = "GeographyPolygon",
  // GeographyMultiPoint = "GeographyMultiPoint",
  // GeographyMultiLineString = "GeographyMultiLineString",
  // GeographyCollection = "GeographyCollection",
  // Geometry = "Geometry",
  // GeometryPoint = "GeometryPoint",
  // GeometryLineString = "GeometryLineString",
  // GeometryPolygon = "GeometryPolygon",
  // GeometryMultiPoint = "GeometryMultiPoint",
  // GeometryMultiPolygon = "GeometryMultiPolygon",
  // GeometryCollection = "GeometryCollection",
}
