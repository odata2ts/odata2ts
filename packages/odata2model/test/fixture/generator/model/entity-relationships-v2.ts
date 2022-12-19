import { DeferredContent } from "@odata2ts/odata-core";

export interface Author {
  id: number;
  name: boolean | null;
}

export interface Book {
  id: number;
  author: Author | DeferredContent;
  altAuthor: Author | null | DeferredContent;
  relatedAuthors: Array<Author> | DeferredContent;
}
