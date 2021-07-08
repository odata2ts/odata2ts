import {
  QBooleanPath,
  QDateTimeOffsetPath,
  QEntityCollectionPath,
  QEntityModel,
  QEntityPath,
  QNumberPath,
  QStringPath,
} from "@odata2ts/odata-query-objects";
import { Person, Address } from "./SimplePersonModel";

export const QPerson: QEntityModel<Person, "name" | "age"> = {
  __collectionPath: "Persons",
  age: new QNumberPath("age"),
  name: new QStringPath("name"),
  deceased: new QBooleanPath("deceased"),
  createdAt: new QDateTimeOffsetPath("createdAt"),
  address: new QEntityPath<Address>("address", () => QAddress),
  altAdresses: new QEntityCollectionPath<Address>("altAdresses", () => QAddress),
};

export const QAddress: QEntityModel<Address, "street"> = {
  __collectionPath: "Addresses",
  street: new QStringPath("street"),
  responsible: new QEntityPath<Person>("responsible", () => QPerson),
};
