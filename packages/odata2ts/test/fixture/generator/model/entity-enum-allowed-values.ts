export enum Status {
  Available = "Available",
  OnLoan = "OnLoan",
  Missing = "Missing",
}

const StatusValues: Record<Status, number> = { [Status.Available]: 0, [Status.OnLoan]: 1, [Status.Missing]: 2 };
const StatusMembers: Record<number, Status> = { 0: Status.Available, 1: Status.OnLoan, 2: Status.Missing };
/** Converts between the members of {@link Status} and the `Edm.Byte` values the service transmits for them, as stated by its `Validation.AllowedValues` annotation. */
export const StatusConverter = {
  id: "StatusConverter",
  from: "Edm.Byte",
  to: "Status",
  convertFrom(value: number | null | undefined): Status | null | undefined {
    return value === null || value === undefined ? value : StatusMembers[value];
  },
  convertTo(value: Status | null | undefined): number | null | undefined {
    return value === null || value === undefined ? value : StatusValues[value];
  },
};

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
   * | Name | `status` |
   * | Type | `Tester.status` |
   * | Nullable | `false` |
   */
  status: Status;
}
