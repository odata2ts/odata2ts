export type Status = "Available" | "OnLoan" | "Missing";

export const Status = ["Available", "OnLoan", "Missing"] as const;
const StatusValues: Record<Status, number> = { Available: 0, OnLoan: 1, Missing: 2 };
const StatusMembers: Record<number, Status> = { 0: "Available", 1: "OnLoan", 2: "Missing" };
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
