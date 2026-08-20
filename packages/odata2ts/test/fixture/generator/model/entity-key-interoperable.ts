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

export interface EditableBook extends Pick<Book, "title" | "isbnCode">, Partial<Pick<Book, "id">> {}

export interface UpdatableBook extends Pick<Book, "title">, Partial<Pick<Book, "id" | "isbnCode">> {}
