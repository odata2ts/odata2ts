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
  Key: Array<{ PropertyRef: Array<{ $: { Name: string } }> }>;
  Property: Array<Property>;
  NavigationProperty: Array<NavigationProperty>;
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
    Nullable: boolean;
    Partner: string;
  };
  // TODO: OnDelete, ReferentialConstraint, etc.
}

export const enum OdataTypes {
  Boolean = "Edm.Boolean",
  String = "Edm.String",
  Int32 = "Edm.Int32",
  Date = "Edm.Date",
  Time = "Edm.Time",
  DateTimeOffset = "Edm.DateTimeOffset",
  Guid = "Edm.Guid",
}
