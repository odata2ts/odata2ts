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
  withPath(newPath: string): any;
}

export type QPrimitivePath =
  | QBooleanPath
  | QNumberPath
  | QStringPath
  | QDatePath
  | QTimeOfDayPath
  | QDateTimeOffsetPath
  | QBinaryPath
  | QGuidPath
  | QEnumPath;

export type QPath = QEntityPath<any, any> | QCollectionPath<any> | QPrimitivePath;
