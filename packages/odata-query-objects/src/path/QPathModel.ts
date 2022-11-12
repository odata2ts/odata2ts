import { ValueConverter } from "@odata2ts/converter-api";

import { QBinaryPath } from "./QBinaryPath";
import { QBooleanPath } from "./QBooleanPath";
import { QCollectionPath } from "./QCollectionPath";
import { QEntityCollectionPath } from "./QEntityCollectionPath";
import { QEntityPath } from "./QEntityPath";
import { QEnumPath } from "./QEnumPath";
import { QNumberPath } from "./QNumberPath";
import { QDatePath } from "./v4/QDatePath";
import { QDateTimeOffsetPath } from "./v4/QDateTimeOffsetPath";
import { QGuidPath } from "./v4/QGuidPath";
import { QStringPath } from "./v4/QStringPath";
import { QTimeOfDayPath } from "./v4/QTimeOfDayPath";

export interface QPathModel {
  converter?: ValueConverter<any, any>;
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
