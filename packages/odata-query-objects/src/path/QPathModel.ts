import { QDatePath } from "./date-time-v4/QDatePath";
import { QDateTimeOffsetPath } from "./date-time-v4/QDateTimeOffsetPath";
import { QTimeOfDayPath } from "./date-time-v4/QTimeOfDayPath";
import { QBooleanPath } from "./QBooleanPath";
import { QEntityCollectionPath } from "./QEntityCollectionPath";
import { QEntityPath } from "./QEntityPath";
import { QNumberPath } from "./QNumberPath";
import { QStringPath } from "./QStringPath";

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
  | QEntityPath<any>
  | QEntityCollectionPath<any>;
