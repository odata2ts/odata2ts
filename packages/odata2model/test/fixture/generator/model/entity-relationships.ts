export interface Author {
  id: number;
  name: boolean | null;
}

export interface Book {
  id: number;
  author?: Author;
  altAuthor?: Author | null;
  relatedAuthors?: Array<Author>;
}
