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
}

export interface EntityContainer {
  $: {
    Name: string;
  };
  EntitySet: Array<EntitySet>;
}

export interface EntitySet {
  $: {
    Name: string;
    EntityType: string;
  };
  NavigationPropertyBinding: Array<NavigationPropertyBinding>;
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
  };
  Key: Array<PropertyRef>;
  Property: Array<Property>;
  NavigationProperty: Array<NavigationProperty>;
}

export interface PropertyRef {
  PropertyRef: Array<{ $: { Name: string } }>;
}

export interface Property {
  $: {
    Name: string;
    Type: OdataTypes;
    MaxLength?: number;
    Nullable?: "true" | "false";
    Precision?: number;
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
