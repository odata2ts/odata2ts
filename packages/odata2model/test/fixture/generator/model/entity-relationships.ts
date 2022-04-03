export interface Author {
  id: string;
  name: string;
}

export interface Book {
  id: string;
  author: Author;
  relatedAuthors?: Array<Author>;
}
