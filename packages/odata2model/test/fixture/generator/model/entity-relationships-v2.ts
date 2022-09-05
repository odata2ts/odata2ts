import { DeferredContent } from "@odata2ts/odata-service";

export interface Author {
  id: number;
  name: boolean | null;
}

export type AuthorId = number | { id: number };

export interface EditableAuthor extends Pick<Author, "id">, Partial<Pick<Author, "name">> {}

export interface Book {
  id: number;
  author: Author | DeferredContent;
  altAuthor: Author | null | DeferredContent;
  relatedAuthors: Array<Author> | DeferredContent;
}

export type BookId = number | { id: number };

export interface EditableBook extends Pick<Book, "id"> {}
