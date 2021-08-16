import { GuidString, BinaryString, DateTimeOffsetString, TimeOfDayString, DateString } from "./odata/ODataTypes";
import { QEnumPath } from "./path/QEnumPath";
import { QBinaryPath } from "./path/QBinaryPath";
import { QDatePath } from "./path/date-time-v4/QDatePath";
import { QTimeOfDayPath } from "./path/date-time-v4/QTimeOfDayPath";
import { QDateTimeOffsetPath } from "./path/date-time-v4/QDateTimeOffsetPath";
import { QGuidPath } from "./path/QGuidPath";
import { QBooleanPath } from "./path/QBooleanPath";
import { QNumberPath } from "./path/QNumberPath";
import { QStringPath } from "./path/QStringPath";
import { QEntityModel } from "./QEntityModel";

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

export const qStringCollection: QEntityModel<StringCollection> = {
  [ATTRIBUTE_NAME]: new QStringPath(PRIMITIVE_VALUE_REFERENCE),
};

export const qNumberCollection: QEntityModel<NumberCollection> = {
  [ATTRIBUTE_NAME]: new QNumberPath(PRIMITIVE_VALUE_REFERENCE),
};

export const qBooleanCollection: QEntityModel<BooleanCollection> = {
  [ATTRIBUTE_NAME]: new QBooleanPath(PRIMITIVE_VALUE_REFERENCE),
};

export const qGuidCollection: QEntityModel<GuidCollection> = {
  [ATTRIBUTE_NAME]: new QGuidPath(PRIMITIVE_VALUE_REFERENCE),
};

export const qBinaryCollection: QEntityModel<BinaryCollection> = {
  [ATTRIBUTE_NAME]: new QBinaryPath(PRIMITIVE_VALUE_REFERENCE),
};

export const qDateTimeOffsetCollection: QEntityModel<DateTimeOffsetCollection> = {
  [ATTRIBUTE_NAME]: new QDateTimeOffsetPath(PRIMITIVE_VALUE_REFERENCE),
};

export const qTimeOfDayCollection: QEntityModel<TimeOfDayCollection> = {
  [ATTRIBUTE_NAME]: new QTimeOfDayPath(PRIMITIVE_VALUE_REFERENCE),
};

export const qDateCollection: QEntityModel<DateCollection> = {
  [ATTRIBUTE_NAME]: new QDatePath(PRIMITIVE_VALUE_REFERENCE),
};

export const qEnumCollection: QEntityModel<EnumCollection<any>> = {
  [ATTRIBUTE_NAME]: new QEnumPath(PRIMITIVE_VALUE_REFERENCE),
};
