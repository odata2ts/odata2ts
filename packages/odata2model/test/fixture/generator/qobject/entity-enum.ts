// @ts-nocheck
import { QEntityModel, QStringPath, QEnumPath, QCollectionPath, qEnumCollection } from "@odata2ts/odata-query-objects";
import type { Choice, Book } from "./TesterModel";

export const qBook: QEntityModel<Book, Choice> = {
  id: new QStringPath("id"),
  myChoice: new QEnumPath("myChoice"),
  otherChoices: new QCollectionPath("otherChoices", () => qEnumCollection),
};
