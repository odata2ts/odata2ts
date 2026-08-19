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
   * | Name | `name` |
   * | Type | `Edm.String` |
   * | Nullable | `false` |
   */
  name: string;
  /**
   *
   * OData Attributes:
   * |Attribute Name | Attribute Value |
   * | --- | ---|
   * | Name | `friends` |
   * | Type | `Collection(Tester.Book)` |
   */
  friends?: Array<Book>;
  /**
   *
   * OData Attributes:
   * |Attribute Name | Attribute Value |
   * | --- | ---|
   * | Name | `bestFriend` |
   * | Type | `Tester.Book` |
   */
  bestFriend?: Book | null;
}

export type BookId = string | { id: string };

export interface EditableBook extends Pick<Book, "name">, Partial<Pick<Book, "id">> {
  /** Create "friends" along with this entity (deep insert), or update it along with it (deep update). */
  friends?: Array<EditableBook>;
  /** Create "bestFriend" along with this entity (deep insert), or update it along with it (deep update). */
  bestFriend?: EditableBook;
}

export interface UpdatableBook extends Pick<Book, "name"> {
  /** Create "friends" along with this entity (deep insert), or update it along with it (deep update). */
  friends?: Array<EditableBook>;
  /** Create "bestFriend" along with this entity (deep insert), or update it along with it (deep update). */
  bestFriend?: EditableBook;
}
