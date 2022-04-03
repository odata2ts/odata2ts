// @ts-nocheck
import { QEntityModel, QStringPath, QEntityPath, QEntityCollectionPath } from "@odata2ts/odata-query-objects";
import type { Book, PublishingMethod } from "./TesterModel";

export const qBook: QEntityModel<Book> = {
  id: new QStringPath("id"),
  method: new QEntityPath("method", () => qPublishingMethod),
  altMethods: new QEntityCollectionPath("altMethods", () => qPublishingMethod),
};
export const qPublishingMethod: QEntityModel<PublishingMethod> = {
  name: new QStringPath("name"),
};
