import { GuidString, BinaryString, DateTimeOffsetString, TimeOfDayString, DateString } from "./odata/ODataTypes";
import { QEnumPath } from "./path/QEnumPath";
import { QBinaryPath } from "./path/QBinaryPath";
import { QDatePath } from "./path/v4/QDatePath";
import { QTimeOfDayPath } from "./path/v4/QTimeOfDayPath";
import { QDateTimeOffsetPath } from "./path/v4/QDateTimeOffsetPath";
import { QGuidPath } from "./path/QGuidPath";
import { QBooleanPath } from "./path/QBooleanPath";
import { QNumberPath } from "./path/QNumberPath";
import { QStringPath } from "./path/v4/QStringPath";
import { QueryObject } from "./QueryObject";
import { QDateTimeOffsetV2Path, QDateTimeV2Path, QStringV2Path, QTimeV2Path } from "./path/v2";

const ATTRIBUTE_NAME = "it";
const PRIMITIVE_VALUE_REFERENCE = "$it";

export interface PrimitiveCollectionType<T> {
  [ATTRIBUTE_NAME]: T;
}

export type StringCollection = PrimitiveCollectionType<string>;
export type NumberCollection = PrimitiveCollectionType<number>;
export type BooleanCollection = PrimitiveCollectionType<boolean>;
export type GuidCollection = PrimitiveCollectionType<GuidString>;
export type BinaryCollection = PrimitiveCollectionType<BinaryString>;
export type DateTimeOffsetCollection = PrimitiveCollectionType<DateTimeOffsetString>;
export type TimeOfDayCollection = PrimitiveCollectionType<TimeOfDayString>;
export type DateCollection = PrimitiveCollectionType<DateString>;
export type EnumCollection<T> = PrimitiveCollectionType<T>;

export type PrimitiveCollection =
  | StringCollection
  | NumberCollection
  | BooleanCollection
  | GuidCollection
  | BinaryCollection
  | DateTimeOffsetCollection
  | TimeOfDayCollection
  | DateCollection
  | EnumCollection<any>;

export abstract class QPrimitiveCollection<QType> extends QueryObject {
  public readonly it;

  constructor(prefix?: string) {
    super(prefix);

    this.it = this.createQPathType(this.withPrefix(PRIMITIVE_VALUE_REFERENCE));
  }

  abstract createQPathType(path: string): QType;
}

export class QStringCollection extends QPrimitiveCollection<QStringPath> {
  createQPathType(path: string) {
    return new QStringPath(path);
  }
}
export const qStringCollection = new QStringCollection();

export class QStringV2Collection extends QPrimitiveCollection<QStringV2Path> {
  createQPathType(path: string) {
    return new QStringV2Path(path);
  }
}
export const qStringV2Collection = new QStringV2Collection();

export class QNumberCollection extends QPrimitiveCollection<QNumberPath> {
  createQPathType(path: string) {
    return new QNumberPath(path);
  }
}
export const qNumberCollection = new QNumberCollection();

export class QBooleanCollection extends QPrimitiveCollection<QBooleanPath> {
  createQPathType(path: string) {
    return new QBooleanPath(path);
  }
}
export const qBooleanCollection = new QBooleanCollection();

export class QGuidCollection extends QPrimitiveCollection<QGuidPath> {
  createQPathType(path: string) {
    return new QGuidPath(path);
  }
}
export const qGuidCollection = new QGuidCollection();

export class QBinaryCollection extends QPrimitiveCollection<QBinaryPath> {
  createQPathType(path: string) {
    return new QBinaryPath(path);
  }
}
export const qBinaryCollection = new QBinaryCollection();

export class QDateTimeOffsetCollection extends QPrimitiveCollection<QDateTimeOffsetPath> {
  createQPathType(path: string) {
    return new QDateTimeOffsetPath(path);
  }
}
export const qDateTimeOffsetCollection = new QDateTimeOffsetCollection();

export class QTimeOfDayCollection extends QPrimitiveCollection<QTimeOfDayPath> {
  createQPathType(path: string) {
    return new QTimeOfDayPath(path);
  }
}
export const qTimeOfDayCollection = new QTimeOfDayCollection();

export class QDateCollection extends QPrimitiveCollection<QDatePath> {
  createQPathType(path: string) {
    return new QDatePath(path);
  }
}
export const qDateCollection = new QDateCollection();

export class QTimeV2Collection extends QPrimitiveCollection<QTimeV2Path> {
  createQPathType(path: string) {
    return new QTimeV2Path(path);
  }
}
export const qTimeV2Collection = new QTimeV2Collection();

export class QDateTimeV2Collection extends QPrimitiveCollection<QDateTimeV2Path> {
  createQPathType(path: string) {
    return new QDateTimeV2Path(path);
  }
}
export const qDateTimeV2Collection = new QDateTimeV2Collection();

export class QDateTimeOffsetV2Collection extends QPrimitiveCollection<QDateTimeOffsetV2Path> {
  createQPathType(path: string) {
    return new QDateTimeOffsetV2Path(path);
  }
}
export const qDateTimeOffsetV2Collection = new QDateTimeOffsetV2Collection();

export class QEnumCollection extends QPrimitiveCollection<QEnumPath> {
  createQPathType(path: string) {
    return new QEnumPath(path);
  }
}
export const qEnumCollection = new QEnumCollection();
