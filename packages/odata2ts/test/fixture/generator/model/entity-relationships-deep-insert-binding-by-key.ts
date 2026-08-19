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
  author?: EditableAuthor | { "@id": AuthorId };
  altAuthor?: EditableAuthor | { "@id": AuthorId } | null;
  relatedAuthors?: Array<EditableAuthor | { "@id": AuthorId }>;
}
