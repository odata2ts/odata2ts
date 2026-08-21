export interface ODataEdmxModelBase<VersionedSchema> {
  "edmx:Edmx": {
    $: {
      Version: string;
      "xmlns:edmx": string;
    };
    "edmx:Reference"?: Array<Reference>;
    "edmx:DataServices": Array<DataService<VersionedSchema>>;
  };
}

/**
 * A vocabulary the document draws terms from. The alias declared here is what annotation terms are
 * prefixed with, and it is freely chosen per document: the very same term reads `Core.Computed` in
 * CAP's metadata and `Org.OData.Core.V1.Computed` in ASP.NET's.
 */
export interface Reference {
  $: {
    Uri: string;
  };
  "edmx:Include"?: Array<Include>;
}

export interface Include {
  $: {
    Namespace: string;
    Alias?: string;
  };
}

/**
 * An annotation applying a vocabulary term to the element it is attached to.
 *
 * Only constant values are of use at generation time, and only the ones we actually evaluate are
 * typed here: an annotation may just as well hold a dynamic expression (`Path`, `If`, `Apply`, ...)
 * which resolves per instance or per request, and those are ignored.
 */
export interface Annotation {
  $: {
    Term: string;
    Qualifier?: string;
    Bool?: "true" | "false";
    String?: string;
    EnumMember?: string;
  };
  Bool?: Array<string>;
  String?: Array<string>;
  EnumMember?: Array<string>;
  Collection?: Array<Collection>;
}

/**
 * A collection valued annotation. Its entries are records where the term declares a structured type, and
 * bare property paths where it declares `Collection(Edm.PropertyPath)` - `Core.OptimisticConcurrency`
 * being the one we read, which may also state an empty collection, meaning that the service does not say
 * how it computes the ETag.
 */
export interface Collection {
  Record?: Array<AnnotationRecord>;
  PropertyPath?: Array<string>;
}

/**
 * One entry of a collection valued annotation: a set of property values, and possibly annotations of
 * its own - `Validation.AllowedValue` carries the value it allows as a property and the symbolic name
 * of that value as a nested `Core.SymbolicName`.
 */
export interface AnnotationRecord extends Annotatable {
  $?: {
    Type?: string;
  };
  PropertyValue?: Array<PropertyValue>;
}

/**
 * One property of a record. The value sits in an attribute named after its type; as everywhere else in
 * the parsed EDMX it arrives as a string, whatever that type says.
 */
export interface PropertyValue {
  $: {
    Property: string;
    Bool?: string;
    String?: string;
    Int?: string;
    EnumMember?: string;
  };
}

/**
 * Any model element an annotation may be attached to directly, as a child element.
 */
export interface Annotatable {
  Annotation?: Array<Annotation>;
}

/**
 * The external form of annotating: a block naming its target by path instead of sitting inside it.
 * Means exactly the same as the inline form - CAP states `Core.Computed` this way, the reference
 * model states it inline.
 */
export interface Annotations extends Annotatable {
  $: {
    Target: string;
    Qualifier?: string;
  };
}

export interface DataService<VersionedSchema> {
  Schema: Array<VersionedSchema>;
}

export interface Schema<ET extends EntityType, CT extends ComplexType> extends Annotatable {
  $: {
    Namespace: string;
    xmlns: string;
    Alias?: string;
  };
  EntityType?: Array<ET>;
  ComplexType?: Array<CT>;
  EnumType?: Array<EnumType>;
  EntityContainer?: Array<any>;
  TypeDefinition?: Array<TypeDefinition>;
  Annotations?: Array<Annotations>;
}

export interface EntityContainer<ES = EntitySet> {
  $: {
    Name: string;
  };
  EntitySet?: Array<ES>;
}

export interface EntitySet extends Annotatable {
  $: {
    Name: string;
    EntityType: string;
  };
}

export interface EntityType extends Annotatable {
  $: {
    Name: string;
    BaseType?: string;
    Abstract?: "true" | "false";
    OpenType?: "true" | "false";
    /**
     * Marks a media entity, i.e. an entity whose own representation is binary content, addressed by
     * appending `$value` to its URL. Inherited by derived types.
     *
     * V4 spelling; V2 knows the same marker as `m:HasStream` and calls such an entity a media link entry.
     */
    HasStream?: "true" | "false";
  };
  Key: Array<PropertyRef>;
  Property: Array<Property>;
}

export interface ComplexType extends Omit<EntityType, "Key"> {}

export interface PropertyRef {
  PropertyRef: Array<{ $: { Name: string } }>;
}

export interface Property extends Annotatable {
  $: {
    Name: string;
    Type: string;
    Nullable?: "true" | "false";
    MaxLength?: number;
    Precision?: number;
    Scale?: number;
  };
}

export interface EnumType {
  $: {
    Name: string;
    UnderlyingType?: string;
    /**
     * Declares the members to be bits which may be combined, which is what makes the `has` operator
     * applicable - V4 defines it for no other type.
     */
    IsFlags?: "true" | "false";
  };
  Member?: Array<Member>;
}

export interface Member {
  $: {
    Name: string;
    /**
     * A declared enum numbers its members, and the parsed EDMX hands the number over as the string it is
     * written as. An enum derived from `Validation.AllowedValues` takes the values from the annotation
     * instead, which may just as well be strings.
     */
    Value: number | string;
  };
}

export interface Parameter extends Property {
  Unicode?: boolean;
}

export interface ReturnType {
  $: {
    Type: string;
  };
}

export interface TypeDefinition {
  $: {
    Name: string;
    UnderlyingType: string;
    MaxLength?: number;
    Precision?: number;
    Scale?: number;
  };
}
