import { QEntityModel, QEntityPath, QStringPath } from "@odata2ts/odata-query-objects";
import { Person, QPerson } from "../custom";

export interface Address {
  street: string;
  responsible: Person;
}

export const QAddress: QEntityModel<Address, "street"> = {
  __collectionPath: "Addresses",
  street: new QStringPath("street"),
  get responsible() {
    return new QEntityPath<Person>("responsible", QPerson);
  },
};
