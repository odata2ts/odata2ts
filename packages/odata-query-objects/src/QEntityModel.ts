import { QDatePath } from "./date-time-v4/QDatePath";
import { QDateTimeOffsetPath } from "./date-time-v4/QDateTimeOffsetPath";
import { QTimeOfDayPath } from "./date-time-v4/QTimeOfDayPath";
import { QBooleanPath } from "./QBooleanPath";
import { QNumberPath } from "./QNumberPath";
import { QStringPath } from "./QStringPath";

export type QEntity = { collectionName: string } & { [key: string]: QPath };

export interface QPathModel {
  getPath(): string;
}

export type QPath = QBooleanPath | QNumberPath | QStringPath | QDatePath | QTimeOfDayPath | QDateTimeOffsetPath;
