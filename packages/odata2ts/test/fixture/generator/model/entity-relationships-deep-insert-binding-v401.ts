export interface Author {
  id: number;
  name: boolean | null;
}

export type AuthorId = number | { id: number };

export interface EditableAuthor extends Partial<Pick<Author, "id" | "name">> {}

export interface Book {
  id: number;
  author?: Author;
  altAuthor?: Author | null;
  relatedAuthors?: Array<Author>;
}

export type BookId = number | { id: number };

export interface EditableBook extends Partial<Pick<Book, "id">> {
  author?: EditableAuthor | { "@id": string };
  altAuthor?: EditableAuthor | { "@id": string } | null;
  relatedAuthors?: Array<EditableAuthor | { "@id": string }>;
}
