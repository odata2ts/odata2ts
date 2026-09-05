import type {
  ComplexType,
  EntityContainer,
  EntityType,
  ODataEdmxModelBase,
  Property,
  ReturnType,
  Schema,
} from "./ODataEdmxModelBase.js";

export interface ODataEdmxModelV3 extends ODataEdmxModelBase<SchemaV3> {}

export interface SchemaV3 extends Schema<EntityTypeV3, ComplexTypeV3> {
  EntityContainer?: Array<EntityContainerV3>;
  Association?: Array<Association>;
}

export interface EntityTypeV3 extends EntityType {
  $: EntityType["$"] & {
    /**
     * Marks a media link entry, i.e. an entity pointing at a media resource which holds its binary
     * content. Same marker as V4's `HasStream`, only in the metadata namespace.
     */
    "m:HasStream"?: "true" | "false";
  };
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
  /**
   * The foreign key this association is realized by. Unlike V4, where the constraint sits on the
   * navigation property, V2 states it once on the association and names the two sides by role.
   */
  ReferentialConstraint?: Array<{
    Principal: Array<AssociationConstraintEnd>;
    Dependent: Array<AssociationConstraintEnd>;
  }>;
}

export interface AssociationEnd {
  $: {
    Type: string;
    Multiplicity: string;
    Role?: string;
  };
}

export interface AssociationConstraintEnd {
  $: { Role: string };
  PropertyRef: Array<{ $: { Name: string } }>;
}
