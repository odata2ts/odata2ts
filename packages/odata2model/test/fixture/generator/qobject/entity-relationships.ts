// @ts-nocheck
import { QEntityModel, QStringPath, QEntityPath, QEntityCollectionPath } from "@odata2ts/odata-query-objects";
import type { Author, Book } from "./TesterModel";

export const qAuthor: QEntityModel<Author> = {
  id: new QStringPath("id"),
  name: new QStringPath("name"),
};
export const qBook: QEntityModel<Book> = {
  id: new QStringPath("id"),
  author: new QEntityPath("author", () => qAuthor),
  relatedAuthors: new QEntityCollectionPath("relatedAuthors", () => qAuthor),
};
