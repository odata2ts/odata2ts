import { DeferredContent } from "@odata2ts/odata-core";

export interface Author {
  id: number;
  name: boolean | null;
}

export interface Book {
  id: number;
  relatedAuthors: { results: Array<Author> } | DeferredContent;
}
