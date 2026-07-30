export interface Author {
  id: number;
}

export type AuthorId = number | { id: number };

export interface EditableAuthor extends Pick<Author, "id"> {}

export interface Book {
  id: number;
  author?: Author;
  altAuthor?: Author | null;
  relatedAuthors?: Array<Author>;
}

export type BookId = number | { id: number };

export interface EditableBook extends Pick<Book, "id"> {
  author?: { "@id": string };
  altAuthor?: { "@id": string } | null;
  relatedAuthors?: Array<{ "@id": string }>;
}
