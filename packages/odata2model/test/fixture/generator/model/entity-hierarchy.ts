import type { GuidString } from "@odata2ts/odata-query-objects";

export interface GrandParent {
  id: GuidString;
}

export interface Parent extends GrandParent {
  parentalAdvice?: boolean;
}

export interface Child extends Parent {
  Ch1ld1shF4n?: boolean;
}
