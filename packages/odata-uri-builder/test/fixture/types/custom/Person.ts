import {
  DateTimeOffsetString,
  QBooleanPath,
  QDateTimeOffsetPath,
  QEntityCollectionPath,
  QEntityModel,
  QEntityPath,
  QNumberPath,
  QStringPath,
} from "@odata2ts/odata-query-objects";
import { Address, QAddress } from "../custom";

export interface Person {
  age: number;
  name: string;
  deceased: boolean;
  createdAt: DateTimeOffsetString;
  address: Address;
  altAdresses: Array<Address>;
}

export const QPerson: QEntityModel<Person> = {
  age: new QNumberPath("age"),
  name: new QStringPath("name"),
  deceased: new QBooleanPath("deceased"),
  createdAt: new QDateTimeOffsetPath("createdAt"),
  address: new QEntityPath<Address>("address", () => QAddress),
  altAdresses: new QEntityCollectionPath<Address>("altAdresses", () => QAddress),
};
