export interface Author {
  id: string;
  name: boolean;
}

export interface Book {
  id: string;
  author: Author;
  relatedAuthors?: Array<Author>;
}
