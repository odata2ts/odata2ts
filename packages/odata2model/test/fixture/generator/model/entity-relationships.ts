import type { GuidString } from "@odata2ts/odata-query-objects";

export interface Author {
  id: GuidString;
  name: boolean;
}

export interface Book {
  id: GuidString;
  author: Author;
  relatedAuthors?: Array<Author>;
}
