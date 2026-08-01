export interface ODataEdmxModelBase<VersionedSchema> {
  "edmx:Edmx": {
    $: {
      Version: string;
      "xmlns:edmx": string;
    };
    // "edmx:Reference": Array<any>;
    "edmx:DataServices": Array<DataService<VersionedSchema>>;
  };
}

export interface DataService<VersionedSchema> {
  Schema: Array<VersionedSchema>;
}

export interface Schema<ET extends EntityType, CT extends ComplexType> {
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
}

export interface EntityContainer<ES = EntitySet> {
  $: {
    Name: string;
  };
  EntitySet?: Array<ES>;
}

export interface EntitySet {
  $: {
    Name: string;
    EntityType: string;
  };
}

export interface EntityType {
  $: {
    Name: string;
    BaseType?: string;
    Abstract?: "true" | "false";
    OpenType?: "true" | "false";
    /**
     * Marks a media entity, i.e. an entity whose own representation is binary content, addressed by
     * appending `$value` to its URL. V4 only, and inherited by derived types.
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

export interface Property {
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
  };
  Member?: Array<Member>;
}

export interface Member {
  $: {
    Name: string;
    Value: number;
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
