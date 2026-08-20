export interface Book {
  /**
   * **Key Property**: This is a key property used to identify the entity.<br/>**Managed**: This property is managed on the server side and cannot be edited.
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
}

export type BookId = string | { id: string };

export interface EditableBook extends Pick<Book, "title">, Partial<Pick<Book, "id">> {}
