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

export const qStringCollection: QEntityModel<{ [ATTRIBUTE_NAME]: string }> = {
  [ATTRIBUTE_NAME]: new QStringPath(PRIMITIVE_VALUE_REFERENCE),
};

export const qNumberCollection: QEntityModel<{ [ATTRIBUTE_NAME]: number }> = {
  [ATTRIBUTE_NAME]: new QNumberPath(PRIMITIVE_VALUE_REFERENCE),
};

export const qBooleanCollection: QEntityModel<{ [ATTRIBUTE_NAME]: boolean }> = {
  [ATTRIBUTE_NAME]: new QBooleanPath(PRIMITIVE_VALUE_REFERENCE),
};

export const qGuidCollection: QEntityModel<{ [ATTRIBUTE_NAME]: GuidString }> = {
  [ATTRIBUTE_NAME]: new QGuidPath(PRIMITIVE_VALUE_REFERENCE),
};

export const qBinaryCollection: QEntityModel<{ [ATTRIBUTE_NAME]: BinaryString }> = {
  [ATTRIBUTE_NAME]: new QBinaryPath(PRIMITIVE_VALUE_REFERENCE),
};

export const qDateTimeOffsetCollection: QEntityModel<{ [ATTRIBUTE_NAME]: DateTimeOffsetString }> = {
  [ATTRIBUTE_NAME]: new QDateTimeOffsetPath(PRIMITIVE_VALUE_REFERENCE),
};

export const qTimeOfDayCollection: QEntityModel<{ [ATTRIBUTE_NAME]: TimeOfDayString }> = {
  [ATTRIBUTE_NAME]: new QTimeOfDayPath(PRIMITIVE_VALUE_REFERENCE),
};

export const qDateCollection: QEntityModel<{ [ATTRIBUTE_NAME]: DateString }> = {
  [ATTRIBUTE_NAME]: new QDatePath(PRIMITIVE_VALUE_REFERENCE),
};

export type GenericEnum = {};

export const qEnumCollection: QEntityModel<{ [ATTRIBUTE_NAME]: GenericEnum }, GenericEnum> = {
  [ATTRIBUTE_NAME]: new QEnumPath(PRIMITIVE_VALUE_REFERENCE),
};
