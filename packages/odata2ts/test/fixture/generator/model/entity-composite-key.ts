export interface Book {
  /**
   * **Key Property**: This is a key property used to identify the entity.<br/>**Immutable**: This property can be set when creating the entity, but not changed afterwards.
   *
   * OData Attributes:
   * |Attribute Name | Attribute Value |
   * | --- | ---|
   * | Name | `tenantId` |
   * | Type | `Edm.String` |
   * | Nullable | `false` |
   */
  tenantId: string;
  /**
   * **Key Property**: This is a key property used to identify the entity.<br/>**Immutable**: This property can be set when creating the entity, but not changed afterwards.
   *
   * OData Attributes:
   * |Attribute Name | Attribute Value |
   * | --- | ---|
   * | Name | `localId` |
   * | Type | `Edm.String` |
   * | Nullable | `false` |
   */
  localId: string;
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

export type BookId = { tenantId: string; localId: string };

export interface EditableBook extends Pick<Book, "title">, Partial<Pick<Book, "tenantId" | "localId">> {}
