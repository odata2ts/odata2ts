// @ts-nocheck
import { QEntityModel, QStringPath } from "@odata2ts/odata-query-objects";
import type { Brand } from "./TesterModel";

export const qBrand: QEntityModel<Brand> = {
  naming: new QStringPath("naming"),
};
