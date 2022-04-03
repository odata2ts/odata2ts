// @ts-nocheck
import {
  QEntityModel,
  QGuidPath,
  QBooleanPath,
  QTimeOfDayPath,
  QDatePath,
  QDateTimeOffsetPath,
  QNumberPath,
  QBinaryPath,
  QStringPath,
  QCollectionPath,
  qStringCollection,
  qNumberCollection,
  qBooleanCollection,
} from "@odata2ts/odata-query-objects";
import type { Book } from "./TesterModel";

export const qBook: QEntityModel<Book> = {
  id: new QGuidPath("id"),
  requiredOption: new QBooleanPath("requiredOption"),
  time: new QTimeOfDayPath("time"),
  optionalDate: new QDatePath("optionalDate"),
  dateTimeOffset: new QDateTimeOffsetPath("dateTimeOffset"),
  testDecimal: new QNumberPath("TestDecimal"),
  testBinary: new QBinaryPath("testBinary"),
  testAny: new QStringPath("testAny"),
  multipleStrings: new QCollectionPath("multipleStrings", () => qStringCollection),
  multipleNumbers: new QCollectionPath("multipleNumbers", () => qNumberCollection),
  multipleBooleans: new QCollectionPath("multipleBooleans", () => qBooleanCollection),
};
