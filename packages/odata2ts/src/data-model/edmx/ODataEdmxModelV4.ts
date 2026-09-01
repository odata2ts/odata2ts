import type {
  Annotatable,
  ComplexType,
  EntityContainer,
  EntitySet,
  EntityType,
  ODataEdmxModelBase,
  Property,
  ReturnType,
  Schema,
} from "./ODataEdmxModelBase.js";

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

export interface NavigationProperty extends Annotatable {
  $: {
    Name: string;
    Type: string;
    Nullable?: "true" | "false";
    Partner?: string;
    /**
     * Marks a containment navigation property: the declaring type contains the targets, which are
     * addressed through it and have no entity set of their own (CSDL §8.4). Absence means false.
     */
    ContainsTarget?: "true" | "false";
  };
  /**
   * The foreign key this navigation is realized by, as stated on the dependent side: `Property` is the
   * dependent property, `ReferencedProperty` the principal one it refers to. Repeatable, one element per
   * property pair of a composite key.
   */
  ReferentialConstraint?: Array<{ $: { Property: string; ReferencedProperty: string } }>;
  // TODO: OnDelete
}

export interface EntityContainerV4 extends EntityContainer<EntitySetV4> {
  Singleton?: Array<Singleton>;
  FunctionImport?: Array<FunctionImport>;
  ActionImport?: Array<ActionImport>;
}

export interface EntitySetV4 extends EntitySet {
  NavigationPropertyBinding?: Array<NavigationPropertyBinding>;
}

export interface Singleton extends Annotatable {
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
    IsComposable?: "true" | "false";
  };
  Parameter?: Array<Parameter>;
  ReturnType?: Array<ReturnType>;
}

export interface Parameter extends Property {
  Unicode?: boolean;
}
