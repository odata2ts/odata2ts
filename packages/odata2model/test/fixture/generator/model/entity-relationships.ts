export interface Author {
  id: number;
  name: boolean;
}

export interface Book {
  id: number;
  author: Author;
  relatedAuthors?: Array<Author>;
}
