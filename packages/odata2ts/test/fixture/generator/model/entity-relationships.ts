export interface Author {
  id: number;
  name: boolean | null;
}

export interface EditableAuthor extends Pick<Author, "id">, Partial<Pick<Author, "name">> {}

export interface Book {
  id: number;
  author?: Author;
  altAuthor?: Author | null;
  relatedAuthors?: Array<Author>;
}

export interface EditableBook extends Pick<Book, "id"> {}
