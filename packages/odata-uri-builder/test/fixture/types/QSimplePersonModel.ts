import {
  QBooleanPath,
  QDateTimeOffsetPath,
  QEntityCollectionPath,
  QEntityPath,
  QNumberPath,
  QStringPath,
  QueryObject,
} from "@odata2ts/odata-query-objects";

export class QPerson extends QueryObject {
  public readonly age = new QNumberPath(this.withPrefix("age"));
  public readonly name = new QStringPath(this.withPrefix("name"));
  public readonly deceased = new QBooleanPath(this.withPrefix("deceased"));
  public readonly createdAt = new QDateTimeOffsetPath(this.withPrefix("createdAt"));
  public readonly address = new QEntityPath<QAddress>(this.withPrefix("Address"), () => QAddress);
  public readonly altAdresses = new QEntityCollectionPath<QAddress>(this.withPrefix("AltAdresses"), () => QAddress);

  constructor(path?: string) {
    super(path);
  }
}

export const qPerson = new QPerson();

export class QAddress extends QueryObject {
  public readonly street = new QStringPath(this.withPrefix("street"));
  public readonly responsible = new QEntityPath<QPerson>(this.withPrefix("responsible"), () => QPerson);

  constructor(path?: string) {
    super(path);
  }
}

export const qAddress = new QAddress();
