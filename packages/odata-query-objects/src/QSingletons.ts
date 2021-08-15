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

export interface PrimitiveCollection<T> {
  it: T;
}
export type QPrimitiveCollection<T> = QEntityModel<PrimitiveCollection<T>, null>;

export const qStringCollection: QPrimitiveCollection<string> = {
  [ATTRIBUTE_NAME]: new QStringPath(PRIMITIVE_VALUE_REFERENCE),
};

export const qNumberCollection: QPrimitiveCollection<number> = {
  [ATTRIBUTE_NAME]: new QNumberPath(PRIMITIVE_VALUE_REFERENCE),
};

export const qBooleanCollection: QPrimitiveCollection<boolean> = {
  [ATTRIBUTE_NAME]: new QBooleanPath(PRIMITIVE_VALUE_REFERENCE),
};

export const qGuidCollection: QPrimitiveCollection<GuidString> = {
  [ATTRIBUTE_NAME]: new QGuidPath(PRIMITIVE_VALUE_REFERENCE),
};

export const qBinaryCollection: QPrimitiveCollection<BinaryString> = {
  [ATTRIBUTE_NAME]: new QBinaryPath(PRIMITIVE_VALUE_REFERENCE),
};

export const qDateTimeOffsetCollection: QPrimitiveCollection<DateTimeOffsetString> = {
  [ATTRIBUTE_NAME]: new QDateTimeOffsetPath(PRIMITIVE_VALUE_REFERENCE),
};

export const qTimeOfDayCollection: QPrimitiveCollection<TimeOfDayString> = {
  [ATTRIBUTE_NAME]: new QTimeOfDayPath(PRIMITIVE_VALUE_REFERENCE),
};

export const qDateCollection: QPrimitiveCollection<DateString> = {
  [ATTRIBUTE_NAME]: new QDatePath(PRIMITIVE_VALUE_REFERENCE),
};

export const qEnumCollection: QPrimitiveCollection<any> = {
  [ATTRIBUTE_NAME]: new QEnumPath(PRIMITIVE_VALUE_REFERENCE),
};
