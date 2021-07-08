import { DateString, DateTimeOffsetString, TimeOfDayString } from "../../src";

export interface SimpleEntity {
  name: string;
  complexton?: ComplexEntity;
}

export interface ComplexEntity {
  articleNo: number;
  description?: string;
  Active: boolean;
  deletedAt?: DateString;
  bestSellingTime?: TimeOfDayString;
  createdAt: DateTimeOffsetString;
  simpleton?: SimpleEntity;
  simpleList: Array<SimpleEntity>;
}
