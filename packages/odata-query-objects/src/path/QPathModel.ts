import { QEnumPath } from "./QEnumPath";
import { QDatePath } from "./v4/QDatePath";
import { QDateTimeOffsetPath } from "./v4/QDateTimeOffsetPath";
import { QTimeOfDayPath } from "./v4/QTimeOfDayPath";
import { QBooleanPath } from "./QBooleanPath";
import { QCollectionPath } from "./QCollectionPath";
import { QEntityPath } from "./QEntityPath";
import { QNumberPath } from "./QNumberPath";
import { QStringPath } from "./v4/QStringPath";
import { QBinaryPath } from "./QBinaryPath";
import { QGuidPath } from "./QGuidPath";
import { QEntityCollectionPath } from "./QEntityCollectionPath";

export interface QPathModel {
  getPath(): string;
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

export type QComplexPath = QEntityPath<any> | QEntityCollectionPath<any> | QCollectionPath<any>;

export type QPath = QPrimitivePath | QComplexPath;
