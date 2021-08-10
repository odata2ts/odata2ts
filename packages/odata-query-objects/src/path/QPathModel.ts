import { QEnumPath } from "./QEnumPath";
import { QDatePath } from "./date-time-v4/QDatePath";
import { QDateTimeOffsetPath } from "./date-time-v4/QDateTimeOffsetPath";
import { QTimeOfDayPath } from "./date-time-v4/QTimeOfDayPath";
import { QBooleanPath } from "./QBooleanPath";
import { QCollectionPath } from "./QCollectionPath";
import { QEntityPath } from "./QEntityPath";
import { QNumberPath } from "./QNumberPath";
import { QStringPath } from "./QStringPath";
import { QBinaryPath } from "./QBinaryPath";
import { QGuidPath } from "./QGuidPath";

export interface QPathModel {
  getPath(): string;
}

export type QPath =
  | QBooleanPath
  | QNumberPath
  | QStringPath
  | QDatePath
  | QTimeOfDayPath
  | QDateTimeOffsetPath
  | QBinaryPath
  | QGuidPath
  | QEnumPath
  | QEntityPath<any, any>
  | QCollectionPath<any, any>;
