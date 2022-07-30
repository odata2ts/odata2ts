import { DeferredContent } from "@odata2ts/odata-service";

export interface Author {
  id: string;
  name: boolean | null;
}

export interface EditableAuthor extends Pick<Author, "id">, Partial<Pick<Author, "name">> {}

export interface Book {
  id: string;
  author: Author | DeferredContent;
  altAuthor: Author | null | DeferredContent;
  relatedAuthors: Array<Author> | DeferredContent;
}

export interface EditableBook extends Pick<Book, "id"> {}
