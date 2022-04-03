// @ts-nocheck
import { QEntityModel, QStringPath } from "@odata2ts/odata-query-objects";
import type { Book } from "./TesterModel";

export const qBook: QEntityModel<Book> = {
  id: new QStringPath("id"),
};
