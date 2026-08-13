export enum Status {
  Available = 0,
  OnLoan = 1,
  Missing = 2,
}

const StatusValues: Record<Status, number> = { [Status.Available]: 0, [Status.OnLoan]: 1, [Status.Missing]: 2 };
const StatusMembers: Record<number, Status> = { 0: Status.Available, 1: Status.OnLoan, 2: Status.Missing };
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
  id: string;
  status: Status;
}
