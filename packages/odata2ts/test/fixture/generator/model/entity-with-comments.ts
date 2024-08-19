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
   * **Applied Converters**: booleanToNumberConverter.
   *
   * OData Attributes:
   * |Attribute Name | Attribute Value |
   * | --- | ---|
   * | Name | `truth` |
   * | Type | `Edm.Boolean` |
   * | Nullable | `false` |
   */
  truth: number;
  /**
   *
   * OData Attributes:
   * |Attribute Name | Attribute Value |
   * | --- | ---|
   * | Name | `time` |
   * | Type | `Edm.TimeOfDay` |
   */
  time: string | null;
  /**
   *
   * OData Attributes:
   * |Attribute Name | Attribute Value |
   * | --- | ---|
   * | Name | `multipleStrings` |
   * | Type | `Collection(Edm.String)` |
   */
  multipleStrings: Array<string>;
}
