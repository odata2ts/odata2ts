import type { GuidString } from "@odata2ts/odata-query-objects";

export interface Book {
  id: GuidString;
  method: PublishingMethod;
  altMethods?: Array<PublishingMethod>;
}

export interface PublishingMethod {
  name?: boolean;
}
