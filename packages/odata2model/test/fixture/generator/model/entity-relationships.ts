export interface Author {
  id: string;
  name: boolean | null;
}

export interface Book {
  id: string;
  author?: Author;
  altAuthor?: Author | null;
  relatedAuthors?: Array<Author>;
}
