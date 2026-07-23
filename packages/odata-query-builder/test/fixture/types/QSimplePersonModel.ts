import {
  QBooleanPath,
  QComplexCollectionPath,
  QComplexPath,
  QDateTimeOffsetPath,
  QEntityCollectionPath,
  QEntityPath,
  QNumberPath,
  QNumericEnumCollectionPath,
  QNumericEnumPath,
  QStringPath,
  QueryObject,
} from "@odata2ts/odata-query-objects";
import { Features } from "./SimplePersonModel";

export class QPerson extends QueryObject {
  public readonly age = new QNumberPath(this.withPrefix("age"));
  public readonly name = new QStringPath(this.withPrefix("name"));
  public readonly deceased = new QBooleanPath(this.withPrefix("deceased"));
  public readonly createdAt = new QDateTimeOffsetPath(this.withPrefix("createdAt"));
  public readonly address = new QComplexPath<QAddress>(this.withPrefix("Address"), () => QAddress);
  public readonly altAddresses = new QComplexCollectionPath<QAddress>(this.withPrefix("AltAdresses"), () => QAddress);
  public readonly feature = new QNumericEnumPath(this.withPrefix("feature"), Features);
  public readonly likedFeatures = new QNumericEnumCollectionPath(this.withPrefix("likedFeatures"), Features);
  public readonly bestFriend = new QEntityPath(this.withPrefix("bestFriend"), () => QPerson);
  public readonly friends = new QEntityCollectionPath(this.withPrefix("friends"), () => QPerson);

  constructor(path?: string) {
    super(path);
  }
}

export const qPerson = new QPerson();

export class QAddress extends QueryObject {
  public readonly street = new QStringPath(this.withPrefix("street"));
  public readonly responsible = new QEntityPath<QPerson>(this.withPrefix("responsible"), () => QPerson);
  public readonly geo = new QComplexPath<QGeoPosition>(this.withPrefix("geo"), () => QGeoPosition);

  constructor(path?: string) {
    super(path);
  }
}

export const qAddress = new QAddress();

export class QGeoPosition extends QueryObject {
  public readonly lat = new QNumberPath(this.withPrefix("lat"));
  public readonly lng = new QNumberPath(this.withPrefix("lng"));

  constructor(path?: string) {
    super(path);
  }
}

export const qGeoPosition = new QGeoPosition();
