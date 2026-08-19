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
   * | Name | `title` |
   * | Type | `Edm.String` |
   * | Nullable | `false` |
   */
  title: string;
  /**
   * **Managed**: This property is managed on the server side and cannot be edited.
   *
   * OData Attributes:
   * |Attribute Name | Attribute Value |
   * | --- | ---|
   * | Name | `popularityScore` |
   * | Type | `Edm.Double` |
   */
  popularityScore: number | null;
  /**
   * **Server Default**: The server generates a value for this property if none is supplied.
   *
   * OData Attributes:
   * |Attribute Name | Attribute Value |
   * | --- | ---|
   * | Name | `createdAt` |
   * | Type | `Edm.DateTimeOffset` |
   * | Nullable | `false` |
   */
  createdAt: string;
  /**
   * **Immutable**: This property can be set when creating the entity, but not changed afterwards.
   *
   * OData Attributes:
   * |Attribute Name | Attribute Value |
   * | --- | ---|
   * | Name | `isbnCode` |
   * | Type | `Edm.String` |
   * | Nullable | `false` |
   */
  isbnCode: string;
}

export type BookId = string | { id: string };

export interface EditableBook extends Pick<Book, "title">, Partial<Pick<Book, "id" | "createdAt" | "isbnCode">> {
  /**
   * **Write-Only**: The server never returns this property, hence it is part of the editable model only.
   *
   * OData Attributes:
   * |Attribute Name | Attribute Value |
   * | --- | ---|
   * | Name | `secret` |
   * | Type | `Edm.String` |
   * | Nullable | `false` |
   */
  secret: string;
}
