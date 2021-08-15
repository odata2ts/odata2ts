import { DateTimeOffsetString } from "@odata2ts/odata-query-objects";

export interface Person {
  age: number;
  name: string;
  deceased: boolean;
  createdAt: DateTimeOffsetString;
  Address: Address;
  AltAdresses: Array<Address>;
}

export interface Address {
  street: string;
  responsible: Person;
}
