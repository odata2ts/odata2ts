import type { DeferredContent } from "@odata2ts/odata-core";

export interface Author {
  id: number;
}

export type AuthorId = number | { id: number };

export interface EditableAuthor extends Pick<Author, "id"> {}

export interface Book {
  id: number;
  author: Author | DeferredContent;
  relatedAuthors: Array<Author> | DeferredContent;
}

export type BookId = number | { id: number };

export interface EditableBook extends Pick<Book, "id"> {
  author?: EditableAuthor | { __metadata: { uri: string } };
  relatedAuthors?: Array<EditableAuthor | { __metadata: { uri: string } }>;
}
