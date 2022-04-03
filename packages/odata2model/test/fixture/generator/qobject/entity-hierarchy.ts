// @ts-nocheck
import { QEntityModel, QStringPath, QBooleanPath } from "@odata2ts/odata-query-objects";
import type { GrandParent, Parent, Child } from "./TesterModel";

export const qGrandParent: QEntityModel<GrandParent> = {
  id: new QStringPath("id"),
};
export const qParent: QEntityModel<Parent> = {
  id: new QStringPath("id"),
  parentalAdvice: new QBooleanPath("parentalAdvice"),
};
export const qChild: QEntityModel<Child> = {
  id: new QStringPath("id"),
  parentalAdvice: new QBooleanPath("parentalAdvice"),
  ch1ld1shF4n: new QStringPath("Ch1ld1shF4n"),
};
