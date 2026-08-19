export interface Book {
  /**
   * **Key Property**: This is a key property used to identify the entity.<br/>**Immutable**: This property can be set when creating the entity, but not changed afterwards.
   *
   * OData Attributes:
   * |Attribute Name | Attribute Value |
   * | --- | ---|
   * | Name | `id` |
   * | Type | `Edm.Guid` |
   * | Nullable | `false` |
   */
  id: string;
  /**
   *
   * OData Attributes:
   * |Attribute Name | Attribute Value |
   * | --- | ---|
   * | Name | `address` |
   * | Type | `Tester.Address` |
   * | Nullable | `false` |
   */
  address: Address;
  /**
   *
   * OData Attributes:
   * |Attribute Name | Attribute Value |
   * | --- | ---|
   * | Name | `coordinates` |
   * | Type | `Tester.Coordinates` |
   * | Nullable | `false` |
   */
  coordinates: Coordinates;
}

export type BookId = string | { id: string };

export interface EditableBook extends Pick<Book, "id"> {
  address: EditableAddress;
  coordinates: EditableCoordinates;
}

export interface UpdatableBook {
  address: UpdatableAddress;
  coordinates: EditableCoordinates;
}

export interface Address {
  /**
   * **Immutable**: This property can be set when creating the entity, but not changed afterwards.
   *
   * OData Attributes:
   * |Attribute Name | Attribute Value |
   * | --- | ---|
   * | Name | `street` |
   * | Type | `Edm.String` |
   * | Nullable | `false` |
   */
  street: string;
  /**
   *
   * OData Attributes:
   * |Attribute Name | Attribute Value |
   * | --- | ---|
   * | Name | `city` |
   * | Type | `Edm.String` |
   * | Nullable | `false` |
   */
  city: string;
}

export interface EditableAddress extends Pick<Address, "street" | "city"> {}

export interface UpdatableAddress extends Pick<Address, "city"> {}

export interface Coordinates {
  /**
   *
   * OData Attributes:
   * |Attribute Name | Attribute Value |
   * | --- | ---|
   * | Name | `lat` |
   * | Type | `Edm.Double` |
   * | Nullable | `false` |
   */
  lat: number;
  /**
   *
   * OData Attributes:
   * |Attribute Name | Attribute Value |
   * | --- | ---|
   * | Name | `lon` |
   * | Type | `Edm.Double` |
   * | Nullable | `false` |
   */
  lon: number;
}

export interface EditableCoordinates extends Pick<Coordinates, "lat" | "lon"> {}
