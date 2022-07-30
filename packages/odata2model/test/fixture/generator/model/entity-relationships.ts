export interface Author {
  id: string;
  name: boolean | null;
}

export interface EditableAuthor extends Pick<Author, "id">, Partial<Pick<Author, "name">> {}

export interface Book {
  id: string;
  author?: Author;
  altAuthor?: Author | null;
  relatedAuthors?: Array<Author>;
}

export interface EditableBook extends Pick<Book, "id"> {
  author?: EditableAuthor;
  altAuthor?: EditableAuthor | null;
  relatedAuthors?: Array<EditableAuthor>;
}
