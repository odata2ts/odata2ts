import {
  ComplexType,
  EntityContainer,
  EntitySet,
  EntityType,
  ODataEdmxModelBase,
  Property,
  ReturnType,
  Schema,
} from "./ODataEdmxModelBase";

export interface ODataEdmxModelV4 extends ODataEdmxModelBase<SchemaV4> {}

export interface SchemaV4 extends Schema<EntityTypeV4, ComplexTypeV4> {
  EntityContainer?: Array<EntityContainerV4>;
  Function?: Array<Operation>;
  Action?: Array<Operation>;
}

export interface EntityTypeV4 extends EntityType {
  NavigationProperty?: Array<NavigationProperty>;
}

export interface ComplexTypeV4 extends ComplexType {
  NavigationProperty?: Array<NavigationProperty>;
}

export interface NavigationProperty {
  $: {
    Name: string;
    Type: string;
    Nullable?: "true" | "false";
    Partner?: string;
  };
  // TODO: OnDelete, ReferentialConstraint, etc.
}

export interface EntityContainerV4 extends EntityContainer<EntitySetV4> {
  Singleton?: Array<Singleton>;
  FunctionImport?: Array<FunctionImport>;
  ActionImport?: Array<ActionImport>;
}

export interface EntitySetV4 extends EntitySet {
  NavigationPropertyBinding?: Array<NavigationPropertyBinding>;
}

export interface Singleton {
  $: {
    Name: string;
    Type: string;
  };
  NavigationPropertyBinding?: Array<NavigationPropertyBinding>;
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

export interface Operation {
  $: {
    Name: string;
    IsBound?: "true" | "false";
  };
  Parameter?: Array<Parameter>;
  ReturnType?: Array<ReturnType>;
}

export interface Parameter extends Property {
  Unicode?: boolean;
}
