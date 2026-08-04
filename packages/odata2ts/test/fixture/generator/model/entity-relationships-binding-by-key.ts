export interface Author {
  id: number;
  name: boolean | null;
}

export type AuthorId = number | { id: number };

export interface EditableAuthor extends Pick<Author, "id">, Partial<Pick<Author, "name">> {}

export interface Book {
  id: number;
  author?: Author;
  altAuthor?: Author | null;
  relatedAuthors?: Array<Author>;
}

export type BookId = number | { id: number };

export interface EditableBook extends Pick<Book, "id"> {
  author?: { "@id": AuthorId };
  altAuthor?: { "@id": AuthorId } | null;
  relatedAuthors?: Array<{ "@id": AuthorId }>;
}
