import {
  ComplexType,
  EntityContainer,
  EntityType,
  ODataEdmxModelBase,
  Property,
  ReturnType,
  Schema,
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
