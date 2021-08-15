import {
  QBooleanPath,
  QDateTimeOffsetPath,
  QCollectionPath,
  QEntityModel,
  QEntityPath,
  QNumberPath,
  QStringPath,
} from "@odata2ts/odata-query-objects";
import { Person, Address } from "./SimplePersonModel";

export const QPerson: QEntityModel<Person> = {
  age: new QNumberPath("age"),
  name: new QStringPath("name"),
  deceased: new QBooleanPath("deceased"),
  createdAt: new QDateTimeOffsetPath("createdAt"),
  address: new QEntityPath<Address>("Address", () => QAddress),
  altAdresses: new QCollectionPath<Address>("AltAdresses", () => QAddress),
};

export const QAddress: QEntityModel<Address> = {
  street: new QStringPath("street"),
  responsible: new QEntityPath<Person>("responsible", () => QPerson),
};
