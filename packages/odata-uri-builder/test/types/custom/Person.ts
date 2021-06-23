import {
  QBooleanPath,
  QEntityCollectionPath,
  QEntityFactory,
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
  address: Address;
  altAdresses: Array<Address>;
}

export const QPerson: QEntityModel<Person, "name" | "age"> = {
  entityName: "Persons",
  age: new QNumberPath("age"),
  name: new QStringPath("name"),
  deceased: new QBooleanPath("deceased"),
  get address() {
    return new QEntityPath<Address>("address", QAddress);
  },
  get altAdresses() {
    return new QEntityCollectionPath<Address>("altAdresses", QAddress);
  },
};
