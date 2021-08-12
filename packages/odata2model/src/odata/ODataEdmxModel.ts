export interface ODataEdmxModel {
  "edmx:Edmx": {
    $: {
      Version: string;
      "xmnlns:edmx": string;
    };
    "edmx:Reference": Array<any>;
    "edmx:DataServices": Array<DataService>;
  };
}

export interface DataService {
  Schema: Array<Schema>;
}

export interface Schema {
  $: {
    Namespace: string;
    xmlns: string;
  };
  EntityContainer: Array<EntityContainer>;
  EntityType: Array<EntityType>;
  ComplexType: Array<ComplexType>;
  EnumType: Array<EnumType>;
  Function: Array<Function>;
  Action: Array<Action>;
}

export interface EntityContainer {
  $: {
    Name: string;
  };
  EntitySet: Array<EntitySet>;
  Singleton: Array<Singleton>;
  FunctionImport: Array<FunctionImport>;
  ActionImport: Array<ActionImport>;
}

export interface EntitySet {
  $: {
    Name: string;
    EntityType: string;
  };
  NavigationPropertyBinding: Array<NavigationPropertyBinding>;
}

export interface Singleton {
  $: {
    Name: string;
    Type: string;
  };
  NavigationPropertyBinding: Array<NavigationPropertyBinding>;
}

export interface FunctionImport {
  $: {
    Name: string;
    Function: string;
    EntitySet: string;
  };
}

export interface ActionImport {
  $: {
    Name: string;
    Action: string;
  };
}

export interface NavigationPropertyBinding {
  $: {
    Path: string;
    Target: string;
  };
}

export interface EntityType {
  $: {
    Name: string;
    BaseType: string;
  };
  Key: Array<PropertyRef>;
  Property: Array<Property>;
  NavigationProperty: Array<NavigationProperty>;
}

export interface ComplexType extends Omit<EntityType, "Key"> {}

export interface PropertyRef {
  PropertyRef: Array<{ $: { Name: string } }>;
}

export interface Property {
  $: {
    Name: string;
    Type: string;
    MaxLength?: number;
    Nullable?: "true" | "false";
    Precision?: number;
  };
}

export interface EnumType {
  $: {
    Name: string;
  };
  Member: Array<Member>;
}

export interface Member {
  $: {
    Name: string;
    Value: number;
  };
}

export interface Function {
  $: {
    Name: string;
    IsBound?: "true" | "false";
  };
  Parameter?: Array<Parameter>;
  ReturnType: Array<ReturnType>;
}

export interface Action {
  $: {
    Name: string;
    IsBound?: "true" | "false";
  };
  Parameter?: Array<Parameter>;
  ReturnType?: Array<ReturnType>;
}

export interface Parameter extends Property {
  Unicode: boolean;
}

export interface ReturnType {
  $: {
    Type: string;
  };
}

export interface NavigationProperty {
  $: {
    Name: string;
    Type: string;
    Nullable?: "true" | "false";
    Partner: string;
  };
  // TODO: OnDelete, ReferentialConstraint, etc.
}

export const enum OdataTypes {
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
  Date = "Edm.Date",
  Time = "Edm.TimeOfDay",
  DateTimeOffset = "Edm.DateTimeOffset",
  // TODO
  // Duration = "Edm.Duration",
  Guid = "Edm.Guid",
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
